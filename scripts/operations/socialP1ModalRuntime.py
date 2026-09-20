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
        "git+https://github.com/resemble-ai/chatterbox.git@5de7a54aa4e5e2baadb0182dde554908b48b85c2",
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
def prepare_models(candidate_id: str = "all") -> dict[str, Any]:
    from huggingface_hub import HfApi, snapshot_download

    candidate_id = _safe_component(candidate_id, "candidate_id")
    if candidate_id not in {"all", "qwen3-tts", "chatterbox-multilingual-v3"}:
        raise RuntimeError("unsupported candidate_id")

    api = HfApi()
    resolved: dict[str, Any] = {}
    sources = (
        ("qwen3-tts", QWEN_REPO),
        ("chatterbox-multilingual-v3", CHATTERBOX_REPO),
    )
    for candidate, repo_id in sources:
        if candidate_id != "all" and candidate != candidate_id:
            continue
        info = api.model_info(repo_id)
        revision = str(info.sha)
        model_dir = Path("/models") / candidate / revision
        cached_files = list(model_dir.rglob("*")) if model_dir.exists() else []
        if not any(path.is_file() for path in cached_files):
            model_dir.mkdir(parents=True, exist_ok=True)
            snapshot_download(repo_id=repo_id, revision=revision, local_dir=model_dir)
        else:
            print(f"Reusing cached Modal model volume: {candidate}@{revision}")
        card_data = getattr(info, "card_data", None)
        license_id = getattr(card_data, "license", None) if card_data is not None else None
        resolved[candidate] = {
            "repo_id": repo_id,
            "resolved_revision": revision,
            "license": license_id,
            "model_dir": str(model_dir),
            "cache_reused": any(path.is_file() for path in cached_files),
        }

    model_volume.commit()
    return resolved


def _run_candidate(*, candidate: str, source_sha: str, run_key: str, model_dir: str, sample_id: str = "all") -> str:
    source_sha = _safe_component(source_sha, "source_sha")
    run_key = _safe_component(run_key, "run_key")
    sample_id = _safe_component(sample_id, "sample_id")
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
        "--sample",
        sample_id,
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
def run_qwen(source_sha: str, run_key: str, model_dir: str, sample_id: str = "all") -> str:
    return _run_candidate(
        candidate="qwen3-tts",
        source_sha=source_sha,
        run_key=run_key,
        model_dir=model_dir,
        sample_id=sample_id,
    )


@app.function(
    image=chatterbox_image,
    gpu="L40S",
    volumes={"/models": model_volume.read_only(), "/evidence": evidence_volume},
    timeout=60 * 30,
)
def run_chatterbox(source_sha: str, run_key: str, model_dir: str, sample_id: str = "all") -> str:
    return _run_candidate(
        candidate="chatterbox-multilingual-v3",
        source_sha=source_sha,
        run_key=run_key,
        model_dir=model_dir,
        sample_id=sample_id,
    )


@app.function(image=prepare_image, volumes={"/evidence": evidence_volume}, timeout=60 * 10)
def combine_runtime_evidence(
    source_sha: str,
    run_key: str,
    model_provenance: dict[str, Any],
    sample_id: str = "all",
    candidate_id: str = "all",
) -> str:
    source_sha = _safe_component(source_sha, "source_sha")
    run_key = _safe_component(run_key, "run_key")
    sample_id = _safe_component(sample_id, "sample_id")
    candidate_id = _safe_component(candidate_id, "candidate_id")
    root = Path("/evidence") / "runs" / source_sha / run_key

    candidate_ids = (
        ["qwen3-tts", "chatterbox-multilingual-v3"]
        if candidate_id == "all"
        else [candidate_id]
    )
    if any(candidate not in {"qwen3-tts", "chatterbox-multilingual-v3"} for candidate in candidate_ids):
        raise RuntimeError("unsupported candidate_id")

    payloads = {
        candidate: _read_json(root / candidate / "runtime-evidence.partial.json")
        for candidate in candidate_ids
    }
    manifest_hashes = {payload.get("source_manifest_sha256") for payload in payloads.values()}
    if len(manifest_hashes) != 1:
        raise RuntimeError("candidate runs are bound to different manifest bytes")
    if any(payload.get("benchmark_eligible") is not True for payload in payloads.values()):
        raise RuntimeError("candidate runtime is not benchmark eligible")

    expected_per_candidate = 4 if sample_id == "all" else 1
    expected_total = expected_per_candidate * len(candidate_ids)
    if any(payload.get("actual_run_count") != expected_per_candidate for payload in payloads.values()):
        raise RuntimeError(f"each selected candidate must contribute exactly {expected_per_candidate} runtime case(s)")

    records = [
        record
        for candidate in candidate_ids
        for record in payloads[candidate].get("runtime_records", [])
    ]
    case_ids = [record.get("benchmark_case_id") for record in records if isinstance(record, dict)]
    if len(records) != expected_total or len(set(case_ids)) != expected_total:
        raise RuntimeError(f"combined runtime evidence must contain exactly {expected_total} unique cases")
    if sample_id != "all" and any(not str(case_id).endswith(f"::{sample_id}") for case_id in case_ids):
        raise RuntimeError("remediation runtime contains a case outside the requested sample")

    combined = {
        "schema_version": "1.0.0",
        "manifest_id": next(iter(payloads.values()))["manifest_id"],
        "source_manifest_sha256": next(iter(payloads.values()))["source_manifest_sha256"],
        "protected_runtime": True,
        "benchmark_eligible": True,
        "requested_sample_id": sample_id,
        "requested_candidate_id": candidate_id,
        "expected_complete_run_count": expected_total,
        "actual_run_count": expected_total,
        "complete_matrix": sample_id == "all",
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
def main(source_sha: str, run_key: str, sample_id: str = "all", candidate_id: str = "all") -> None:
    source_sha = _safe_component(source_sha, "source_sha")
    run_key = _safe_component(run_key, "run_key")
    sample_id = _safe_component(sample_id, "sample_id")
    candidate_id = _safe_component(candidate_id, "candidate_id")
    if candidate_id not in {"all", "qwen3-tts", "chatterbox-multilingual-v3"}:
        raise RuntimeError("unsupported candidate_id")

    models = prepare_models.remote(candidate_id)
    if candidate_id in {"all", "qwen3-tts"}:
        run_qwen.remote(source_sha, run_key, models["qwen3-tts"]["model_dir"], sample_id)
    if candidate_id in {"all", "chatterbox-multilingual-v3"}:
        run_chatterbox.remote(
            source_sha,
            run_key,
            models["chatterbox-multilingual-v3"]["model_dir"],
            sample_id,
        )
    root = combine_runtime_evidence.remote(source_sha, run_key, models, sample_id, candidate_id)
    print(root)
