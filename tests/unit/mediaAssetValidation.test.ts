import { describe, it, expect } from 'vitest';
import {
  validateMediaAssetUrl,
  isPrivateAddress,
  type AddressResolver,
} from '../../server/socialMedia/mediaAssetValidation';

/** Never hit real DNS in tests: the resolver is injected. */
const resolvesTo = (...addresses: string[]): AddressResolver => async () => addresses;
const failsToResolve: AddressResolver = async () => {
  throw new Error('ENOTFOUND');
};

const PUBLIC = resolvesTo('93.184.216.34');

describe('WP-N3 media asset validation', () => {
  describe('accepts a legitimate public asset', () => {
    it('allows https on a public host', async () => {
      const result = await validateMediaAssetUrl('https://cdn.example.com/clip.mp4', PUBLIC);
      expect(result.ok).toBe(true);
    });

    it('allows a public IP literal without DNS', async () => {
      const result = await validateMediaAssetUrl('https://93.184.216.34/clip.mp4', failsToResolve);
      expect(result.ok).toBe(true);
    });

    it('tolerates surrounding whitespace', async () => {
      const result = await validateMediaAssetUrl('  https://cdn.example.com/clip.mp4  ', PUBLIC);
      expect(result.ok).toBe(true);
    });
  });

  // ESS-0024 §13: invalid/private media URL -> DENY.
  describe('DENY cases', () => {
    it('denies an empty or malformed url', async () => {
      expect((await validateMediaAssetUrl('', PUBLIC)).code).toBe('media_url_malformed');
      expect((await validateMediaAssetUrl('not a url', PUBLIC)).code).toBe('media_url_malformed');
      expect((await validateMediaAssetUrl('/relative/clip.mp4', PUBLIC)).code).toBe('media_url_malformed');
    });

    it('denies non-https schemes', async () => {
      for (const url of [
        'http://cdn.example.com/clip.mp4',
        'file:///etc/passwd',
        'ftp://cdn.example.com/clip.mp4',
        'data:video/mp4;base64,AAAA',
      ]) {
        const result = await validateMediaAssetUrl(url, PUBLIC);
        expect(result.ok, url).toBe(false);
      }
    });

    it('denies embedded credentials', async () => {
      const result = await validateMediaAssetUrl('https://user:pass@cdn.example.com/clip.mp4', PUBLIC);
      expect(result.code).toBe('media_url_credentials');
    });

    it('denies loopback and internal hostnames', async () => {
      for (const host of ['localhost', 'api.internal', 'db.local', 'box.home.arpa']) {
        const result = await validateMediaAssetUrl(`https://${host}/clip.mp4`, PUBLIC);
        expect(result.code, host).toBe('media_url_private_host');
      }
    });

    it('denies cloud metadata and private IP literals', async () => {
      for (const ip of [
        '169.254.169.254', // cloud metadata
        '127.0.0.1',
        '10.0.0.5',
        '172.16.0.1',
        '192.168.1.1',
        '100.64.0.1', // CGNAT
        '0.0.0.0',
      ]) {
        const result = await validateMediaAssetUrl(`https://${ip}/clip.mp4`, failsToResolve);
        expect(result.code, ip).toBe('media_url_private_host');
      }
    });

    it('denies IPv6 loopback, link-local and unique-local literals', async () => {
      for (const ip of ['[::1]', '[fe80::1]', '[fc00::1]', '[fd12:3456::1]']) {
        const result = await validateMediaAssetUrl(`https://${ip}/clip.mp4`, failsToResolve);
        expect(result.code, ip).toBe('media_url_private_host');
      }
    });

    // The URL parser rewrites ::ffff:169.254.169.254 to ::ffff:a9fe:a9fe, so both
    // spellings must be caught — matching the dotted form alone is a bypass.
    it('denies IPv4-mapped IPv6 pointing at metadata, in either spelling', async () => {
      for (const host of ['[::ffff:169.254.169.254]', '[::ffff:a9fe:a9fe]', '[::ffff:10.0.0.1]']) {
        const result = await validateMediaAssetUrl(`https://${host}/clip.mp4`, failsToResolve);
        expect(result.code, host).toBe('media_url_private_host');
      }
    });

    it('denies a public name that resolves into private space', async () => {
      const result = await validateMediaAssetUrl(
        'https://sneaky.example.com/clip.mp4',
        resolvesTo('169.254.169.254'),
      );
      expect(result.code).toBe('media_url_private_host');
    });

    it('denies when any resolved address is private', async () => {
      const result = await validateMediaAssetUrl(
        'https://mixed.example.com/clip.mp4',
        resolvesTo('93.184.216.34', '10.1.2.3'),
      );
      expect(result.code).toBe('media_url_private_host');
    });

    it('denies an unresolvable or address-less host', async () => {
      expect((await validateMediaAssetUrl('https://nope.example/clip.mp4', failsToResolve)).code).toBe(
        'media_url_unresolvable',
      );
      expect((await validateMediaAssetUrl('https://nope.example/clip.mp4', resolvesTo())).code).toBe(
        'media_url_unresolvable',
      );
    });
  });

  describe('isPrivateAddress', () => {
    it('classifies public addresses as public', () => {
      expect(isPrivateAddress('93.184.216.34')).toBe(false);
      expect(isPrivateAddress('2606:2800:220:1::1')).toBe(false);
    });

    it('treats non-IP input as unsafe', () => {
      expect(isPrivateAddress('cdn.example.com')).toBe(true);
      expect(isPrivateAddress('')).toBe(true);
    });
  });
});
