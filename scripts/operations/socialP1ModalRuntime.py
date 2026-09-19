from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

import modal

APP_NAME = "capital-ai-social-p1-benchmark"
MODEL_VOLUME_NAME = "capital-ai-social-p1-model-cache"
EVIDENCE_VOLUME_NAME = "capital-ai-social-p1-evidence"
QWEN_REPO = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"
CHATTERBOX_REPO = "ResembleAI/chatterbox"

app = modal.App(APP_NAME)
model_volume = modal.Volume.from_name(MODEL_VOLUME_NAME, create_if_missing=True)
evidence_volume = modal.Volume.from_name(EVIDENCE_VOLUME_NAME, create_if_missing=True)

repo_root = Path(__file__).resolve().parents[2] if modal.is_local() else Path("/workspace")
ignores = [".git/**", "node_modules/**", "dist/**", "coverage/**", ".venv/**", "**/__pycache__/**"]

prepare_image = modal.Image.debian_slim(python_version="3.11").uv_pip_install("huggingface-hub==0.36.0")

qwen_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.11")
    .entrypoint([])
    .apt_install("git", "ffmpeg", "libsndfile1", "sox", "build-essential")
    .pip_install("ninja", "packaging", "wheel", "setuptools")
    .pip_install(
        "torch==2.6.0",
        "torchaudio==2.6.0",
        "numpy<2",
        "soundfile==0.13.1",
        "huggingface-hub==0.36.0",
        "qwen-tts==0.1.1",
    )
    .pip_install("flash-attn==2.7.4.post1", extra_options="--no-build-isolation")
    .add_local_dir(repo_root, remote_path="/workspace", ignore=ignores)
)

chatterbox_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.11")
    .entrypoint([])
    .apt_install("git", "ffmpeg", "libsndfile1", "sox")
    .pip_install(
        "soundfile==0.13.1",
        "chatterbox-tts==0.1.7",
    )
    .add_local_dir(repo_root, remote_path="/workspace", ignore=ignores)
)


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError(f"{path} must contain a JSON object")
    return value


def _safe_component(value: str, field: str) -> str:
    normalized = value.strip()
    allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._"
    if not normalized or any(ch not in allowed for ch in normalized):
        raise RuntimeError(f"invalid {field}")
    return normalized


@app.function(image=prepare_image, volumes={"/models": model_volume}, timeout=60 * 30)
def prepare_models() -> dict[str, Any]:
    from huggingface_hub import HfApi, snapshot_download

    api = HfApi()
    resolved: dict[str, Any] = {}
    for candidate, repo_id in (
        ("qwen3-tts", QWEN_REPO),
        ("chatterbox-multilingual-v3", CHATTERBOX_REPO),
    ):
        info = api.model_info(repo_id)
        revision = str(info.sha)
        model_dir = Path("/models") / candidate / revision
        model_dir.mkdir(parents=True, exist_ok=True)
        snapshot_download(repo_id=repo_id, revision=revision, local_dir=model_dir)
        card_data = getattr(info, "card_data", None)
        license_id = getattr(card_data, "license", None) if card_data is not None else None
        resolved[candidate] = {
            "repo_id": repo_id,
            "resolved_revision": revision,
            "license": license_id,
            "model_dir": str(model_dir),
        }

    model_volume.commit()
    return resolved


def _run_candidate(*, candidate: str, source_sha: str, run_key: str, model_dir: str) -> str:
    source_sha = _safe_component(source_sha, "source_sha")
    run_key = _safe_component(run_key, "run_key")
    output_dir = Path("/evidence") / "runs" / source_sha / run_key / candidate
    if output_dir.exists():
        shutil.rmtree(output_dir)

    command = [
        "python",
        "scripts/operations/socialP1TtsRuntime.py",
        "--output-dir",
        str(output_dir),
        "--candidate",
        candidate,
        "--device",
        "cuda:0",
    ]
    if candidate == "qwen3-tts":
        command += ["--qwen-model-dir", model_dir]
    else:
        command += ["--chatterbox-model-dir", model_dir]

    subprocess.run(command, cwd="/workspace", check=True)
    evidence_volume.commit()
    return str(output_dir)


@app.function(
    image=qwen_image,
    gpu="L40S",
    volumes={"/models": model_volume.read_only(), "/evidence": evidence_volume},
    timeout=60 * 30,
)
def run_qwen(source_sha: str, run_key: str, model_dir: str) -> str:
    return _run_candidate(
        candidate="qwen3-tts",
        source_sha=source_sha,
        run_key=run_key,
        model_dir=model_dir,
    )


@app.function(
    image=chatterbox_image,
    gpu="L40S",
    volumes={"/models": model_volume.read_only(), "/evidence": evidence_volume},
    timeout=60 * 30,
)
def run_chatterbox(source_sha: str, run_key: str, model_dir: str) -> str:
    return _run_candidate(
        candidate="chatterbox-multilingual-v3",
        source_sha=source_sha,
        run_key=run_key,
        model_dir=model_dir,
    )


@app.function(image=prepare_image, volumes={"/evidence": evidence_volume}, timeout=60 * 10)
def combine_runtime_evidence(
    source_sha: str,
    run_key: str,
    model_provenance: dict[str, Any],
) -> str:
    source_sha = _safe_component(source_sha, "source_sha")
    run_key = _safe_component(run_key, "run_key")
    root = Path("/evidence") / "runs" / source_sha / run_key

    qwen = _read_json(root / "qwen3-tts" / "runtime-evidence.partial.json")
    chatter = _read_json(root / "chatterbox-multilingual-v3" / "runtime-evidence.partial.json")

    if qwen.get("source_manifest_sha256") != chatter.get("source_manifest_sha256"):
        raise RuntimeError("candidate runs are bound to different manifest bytes")
    if qwen.get("benchmark_eligible") is not True or chatter.get("benchmark_eligible") is not True:
        raise RuntimeError("candidate runtime is not benchmark eligible")
    if qwen.get("actual_run_count") != 4 or chatter.get("actual_run_count") != 4:
        raise RuntimeError("each candidate must contribute exactly four runtime cases")

    records = list(qwen.get("runtime_records", [])) + list(chatter.get("runtime_records", []))
    case_ids = [record.get("benchmark_case_id") for record in records if isinstance(record, dict)]
    if len(records) != 8 or len(set(case_ids)) != 8:
        raise RuntimeError("combined runtime evidence must contain exactly eight unique cases")

    combined = {
        "schema_version": "1.0.0",
        "manifest_id": qwen["manifest_id"],
        "source_manifest_sha256": qwen["source_manifest_sha256"],
        "protected_runtime": True,
        "benchmark_eligible": True,
        "expected_complete_run_count": 8,
        "actual_run_count": 8,
        "complete_matrix": True,
        "runtime_records": records,
        "truth_boundary": (
            "REAL_RUNTIME_EVIDENCE_COMPLETE — transcript and human listening review are still "
            "separate required acceptance evidence and must not be fabricated."
        ),
    }

    combined_path = root / "runtime-evidence.partial.json"
    combined_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    provenance = {
        "schema_version": "1.0.0",
        "source_sha": source_sha,
        "run_key": run_key,
        "models": model_provenance,
        "combined_runtime_evidence_sha256": _sha256_bytes(combined_path.read_bytes()),
    }
    (root / "model-provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    evidence_volume.commit()
    return str(root)


@app.local_entrypoint()
def main(source_sha: str, run_key: str) -> None:
    source_sha = _safe_component(source_sha, "source_sha")
    run_key = _safe_component(run_key, "run_key")
    models = prepare_models.remote()
    run_qwen.remote(source_sha, run_key, models["qwen3-tts"]["model_dir"])
    run_chatterbox.remote(
        source_sha,
        run_key,
        models["chatterbox-multilingual-v3"]["model_dir"],
    )
    root = combine_runtime_evidence.remote(source_sha, run_key, models)
    print(root)
