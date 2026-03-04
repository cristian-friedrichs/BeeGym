import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
    interval: number // ms
    uniqueTokenPerInterval: number
}

export function rateLimit(options: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    })

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0]
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, [1])
                }
                tokenCount[0] += 1

                const currentUsage = tokenCount[0]
                const isRateLimited = currentUsage >= limit

                return isRateLimited ? reject() : resolve()
            }),
    }
}

// 🔒 Uso em API Routes
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minuto
    uniqueTokenPerInterval: 500,
})

export async function withRateLimit(
    req: Request,
    limit: number = 10
): Promise<Response | null> {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    try {
        await limiter.check(limit, ip)
        return null // Passou no rate limit
    } catch {
        return new Response('Rate limit exceeded', { status: 429 })
    }
}
