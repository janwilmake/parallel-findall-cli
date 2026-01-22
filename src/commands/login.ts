import http from 'http';
import crypto from 'crypto';
import { URL, URLSearchParams } from 'url';
import { saveApiKey, getConfigPath } from '../config/store.js';

const CLIENT_ID = 'findall-cli';
const AUTHORIZATION_URL = 'https://platform.parallel.ai/getKeys/authorize';
const TOKEN_URL = 'https://platform.parallel.ai/getKeys/token';
const REDIRECT_PORT = 8742;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

function buildAuthorizationUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'key:read',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });
  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

function waitForCallback(
  expectedState: string,
  codeVerifier: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '', `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400);
        res.end(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1>Authentication Failed</h1>
              <p>Error: ${error}</p>
              <p>You can close this window.</p>
            </body>
          </html>
        `);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code || !state) {
        res.writeHead(400);
        res.end('Missing code or state');
        server.close();
        reject(new Error('Missing code or state in callback'));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400);
        res.end('Invalid state');
        server.close();
        reject(new Error('State mismatch - possible CSRF attack'));
        return;
      }

      try {
        const apiKey = await exchangeCodeForToken(code, codeVerifier);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1>Authentication Successful!</h1>
              <p>Your API key has been saved. You can close this window.</p>
            </body>
          </html>
        `);

        server.close();
        resolve(apiKey);
      } catch (err) {
        res.writeHead(500);
        res.end(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1>Authentication Failed</h1>
              <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
              <p>You can close this window.</p>
            </body>
          </html>
        `);
        server.close();
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`Listening for callback on port ${REDIRECT_PORT}...`);
    });

    server.on('error', (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}

export async function login(): Promise<void> {
  try {
    console.log('Starting Parallel authentication...\n');

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    const authUrl = buildAuthorizationUrl(codeChallenge, state);

    console.log('Please open this URL in your browser to authenticate:\n');
    console.log(authUrl);
    console.log('\nWaiting for authentication...');

    // Try to open browser automatically
    const { exec } = await import('child_process');
    const platform = process.platform;
    const openCommand = platform === 'darwin' ? 'open' :
                        platform === 'win32' ? 'start' : 'xdg-open';

    exec(`${openCommand} "${authUrl}"`, (error) => {
      if (error) {
        // Silently ignore - user can open URL manually
      }
    });

    const apiKey = await waitForCallback(state, codeVerifier);

    await saveApiKey(apiKey);

    console.log('\n✅ Successfully authenticated!');
    console.log(`API key saved to: ${getConfigPath()}`);
    console.log('\nYou can now use findall commands without specifying --api-key');

  } catch (error) {
    console.error('\n❌ Authentication failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
