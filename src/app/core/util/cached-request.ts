import { Observable, catchError, shareReplay, throwError } from 'rxjs';

/**
 * Small time-based request cache for read endpoints.
 *
 * <p>Within the TTL, all callers share a single in-flight (or already-resolved)
 * HTTP response, so components that load the same data on the same page — or in
 * quick succession across navigations — do not each hit the network. Errors are
 * never cached: a failed request clears the cache so the next call retries.
 */
export class CachedRequest<T> {
  private cache$: Observable<T> | null = null;
  private expiry = 0;

  constructor(
    private readonly ttlMs: number,
    private readonly factory: () => Observable<T>,
  ) {}

  get(): Observable<T> {
    const now = Date.now();
    if (this.cache$ && now <= this.expiry) {
      return this.cache$;
    }
    this.expiry = now + this.ttlMs;
    this.cache$ = this.factory().pipe(
      catchError((err) => {
        this.invalidate();
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.cache$;
  }

  /** Drops any cached value so the next {@link get} refetches. */
  invalidate(): void {
    this.cache$ = null;
    this.expiry = 0;
  }
}
