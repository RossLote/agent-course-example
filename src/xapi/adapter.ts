// The fetch adapter the tracker gives @xapi/xapi in place of the library's own 'fetch' one. It
// sends the same requests (the library still builds the URL, the headers and the body), but a
// failed answer keeps its HTTP status, so a State read can tell a 404 from an outage; nothing is
// answered from the HTTP cache, so a State read always reaches the record store; and the page's
// last sends can ask for `keepalive`.
import XAPI from '@xapi/xapi';

/** The adapter function @xapi/xapi takes (the library does not export its type). */
type AdapterFunction = Extract<NonNullable<ConstructorParameters<typeof XAPI>[0]['adapter']>, (...args: never[]) => unknown>;
type AdapterParams = Parameters<AdapterFunction>[0];
type AdapterResponse<T> = Awaited<ReturnType<typeof adapterResponse<T>>>;

/** A record store's answer that was not a success, with its status. */
export class RecordStoreError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'RecordStoreError';
    this.status = status;
  }
}

/** An adapter on fetch with `init` added to every request (`keepalive`, say), never from the HTTP cache. */
export function fetchAdapter(init: RequestInit = {}): AdapterFunction {
  return async function adapter<T>({ url, method, headers = {}, data }: AdapterParams): Promise<AdapterResponse<T>> {
    const body = headers['Content-Type'] === 'application/json' ? JSON.stringify(data) : data;
    const response = await fetch(url, { ...init, method, headers, body, cache: 'no-store' });
    if (!response.ok) throw new RecordStoreError(response.status, await response.text());
    return adapterResponse<T>(response);
  };
}

async function adapterResponse<T>(response: Response) {
  const text = await response.text();
  // As the library's own adapter does: JSON when it parses, else the text. The caller says what
  // it expects with T and checks what it got (isStateDocument).
  return { data: parseBody(text) as T, headers: Object.fromEntries(response.headers.entries()), status: response.status };
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
