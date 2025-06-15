import { createHash } from 'crypto'

export interface UniversalIdMetadata {
  shardId: string
  recordType: string
  timestamp?: number
}

export interface DecodedUniversalId {
  timestamp: number
  shardId: string
  recordType: string
  random: string
}

export class UniversalIdGenerator {
  private static readonly BASE28_CHARS = '0123456789abcdefghjkmnpqrstv'
  private static readonly TIMESTAMP_LENGTH = 10
  private static readonly SHARD_HASH_LENGTH = 10
  private static readonly TYPE_HASH_LENGTH = 4
  private static readonly RANDOM_LENGTH = 8

  private shardCache = new Map<string, string>()
  private typeCache = new Map<string, string>()
  private reverseShardCache = new Map<string, string>()
  private reverseTypeCache = new Map<string, string>()
  private readonly maxCacheSize = 1000

  private toBase28(num: number, length: number): string {
    let result = ''
    const base = this.BASE28_CHARS.length

    while (num > 0) {
      result = this.BASE28_CHARS[num % base] + result
      num = Math.floor(num / base)
    }

    return result.padStart(length, '0')
  }

  private fromBase28(str: string): number {
    let result = 0
    const base = this.BASE28_CHARS.length

    for (let i = 0; i < str.length; i++) {
      result = result * base + this.BASE28_CHARS.indexOf(str[i])
    }

    return result
  }

  private hashComponent(value: string, length: number): string {
    const hash = createHash('sha256').update(value).digest('hex')
    const numericHash = parseInt(hash.substring(0, 12), 16)
    return this.toBase28(numericHash, length)
  }

  private getCachedHash(value: string, cache: Map<string, string>, length: number): string {
    if (cache.has(value)) {
      return cache.get(value)!
    }

    const hash = this.hashComponent(value, length)

    if (cache.size >= this.maxCacheSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    cache.set(value, hash)
    return hash
  }

  private generateRandom(length: number): string {
    let result = ''
    const chars = this.BASE28_CHARS
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }

    return result
  }

  async generate(metadata: UniversalIdMetadata): Promise<string> {
    const timestamp = metadata.timestamp || Date.now()
    const timestampStr = this.toBase28(timestamp, UniversalIdGenerator.TIMESTAMP_LENGTH)

    const shardHash = this.getCachedHash(
      metadata.shardId,
      this.shardCache,
      UniversalIdGenerator.SHARD_HASH_LENGTH
    )

    const typeHash = this.getCachedHash(
      metadata.recordType,
      this.typeCache,
      UniversalIdGenerator.TYPE_HASH_LENGTH
    )

    const random = this.generateRandom(UniversalIdGenerator.RANDOM_LENGTH)

    // Store reverse mappings
    this.reverseShardCache.set(shardHash, metadata.shardId)
    this.reverseTypeCache.set(typeHash, metadata.recordType)

    return `${timestampStr}${shardHash}${typeHash}${random}`
  }

  async decode(id: string): Promise<DecodedUniversalId> {
    if (id.length !== 32) {
      throw new Error(`Invalid ID length: expected 32, got ${id.length}`)
    }

    const timestampStr = id.substring(0, UniversalIdGenerator.TIMESTAMP_LENGTH)
    const shardHash = id.substring(
      UniversalIdGenerator.TIMESTAMP_LENGTH,
      UniversalIdGenerator.TIMESTAMP_LENGTH + UniversalIdGenerator.SHARD_HASH_LENGTH
    )
    const typeHash = id.substring(
      UniversalIdGenerator.TIMESTAMP_LENGTH + UniversalIdGenerator.SHARD_HASH_LENGTH,
      UniversalIdGenerator.TIMESTAMP_LENGTH +
        UniversalIdGenerator.SHARD_HASH_LENGTH +
        UniversalIdGenerator.TYPE_HASH_LENGTH
    )
    const random = id.substring(
      UniversalIdGenerator.TIMESTAMP_LENGTH +
        UniversalIdGenerator.SHARD_HASH_LENGTH +
        UniversalIdGenerator.TYPE_HASH_LENGTH
    )

    const timestamp = this.fromBase28(timestampStr)

    const shardId = this.reverseShardCache.get(shardHash)
    const recordType = this.reverseTypeCache.get(typeHash)

    if (!shardId || !recordType) {
      throw new Error('Unable to decode ID: missing shard or type information in cache')
    }

    return {
      timestamp,
      shardId,
      recordType,
      random,
    }
  }

  getCacheStats() {
    return {
      shardCacheSize: this.shardCache.size,
      typeCacheSize: this.typeCache.size,
      reverseShardCacheSize: this.reverseShardCache.size,
      reverseTypeCacheSize: this.reverseTypeCache.size,
      maxCacheSize: this.maxCacheSize,
    }
  }
}
