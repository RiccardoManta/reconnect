# Instructions for Running Next.js Locally on https://localhost:443

This guide explains how to set up your local development environment to serve the Next.js application over HTTPS on port 443.

**Prerequisites:**

*   Node.js and npm/yarn installed.
*   `mkcert` installed (for generating locally-trusted development certificates).

**1. Install `mkcert` (if you haven't already):**

   `mkcert` is a tool for creating development SSL/TLS certificates that are automatically trusted by your system and browsers.

   *   **macOS:**
      ```bash
      brew install mkcert
      brew install nss # If using Firefox
      ```
   *   **Linux:** Follow instructions on the [mkcert GitHub page](https://github.com/FiloSottile/mkcert#linux) (usually involves downloading a binary or using a package manager).
   *   **Windows:** Use Chocolatey (`choco install mkcert`) or Scoop (`scoop install mkcert`), or download the binary from the GitHub page.

**2. Generate Local Certificate Authority & Certificate:**

   First, install the local Certificate Authority (CA) created by `mkcert`. You only need to do this once per machine.

   ```bash
   mkcert -install
   ```

   Next, generate the certificate files specifically for `localhost`. This command creates two files (e.g., `localhost+1.pem` and `localhost+1-key.pem`) in the current directory.

   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```

   *   **Important:** Move these two generated `.pem` files to a known location in your project, for example, a new directory like `certs/`. Make sure **NOT** to commit these certificate files to Git, especially the key file. Add `certs/` to your `.gitignore` file.

**3. Create a Custom Node.js Server File:**

   The standard `next dev` command doesn't directly support custom HTTPS configurations. We need a simple custom Node.js server to handle HTTPS and then pass requests to Next.js.

   Create a file named `server.js` in the root of your project with the following content:

   ```javascript
   // server.js
   const { createServer } = require('https');
   const { parse } = require('url');
   const next = require('next');
   const fs = require('fs');
   const path = require('path');

   const dev = process.env.NODE_ENV !== 'production';
   const app = next({ dev });
   const handle = app.getRequestHandler();

   // --- Configuration ---
   const port = 443;
   const certPath = path.join(__dirname, 'certs'); // Adjust if you put certs elsewhere
   const keyFilePath = path.join(certPath, 'localhost+1-key.pem'); // Adjust filename if needed
   const certFilePath = path.join(certPath, 'localhost+1.pem');   // Adjust filename if needed
   // -------------------

   const httpsOptions = {
     key: fs.readFileSync(keyFilePath),
     cert: fs.readFileSync(certFilePath),
   };

   app.prepare().then(() => {
     createServer(httpsOptions, (req, res) => {
       const parsedUrl = parse(req.url, true);
       handle(req, res, parsedUrl);
     }).listen(port, (err) => {
       if (err) throw err;
       console.log(`> Ready on https://localhost:${port}`);
     });
   }).catch(err => {
     console.error('Error starting server:', err);
     process.exit(1); // Exit if Next.js preparation fails
   });

   // Basic error handling for certificate file loading
   try {
       fs.accessSync(keyFilePath, fs.constants.R_OK);
       fs.accessSync(certFilePath, fs.constants.R_OK);
   } catch (err) {
       console.error(`\n\n!!! Error: Certificate files not found or not readable at:\n    ${keyFilePath}\n    ${certFilePath}`);
       console.error("Please ensure you have run 'mkcert localhost 127.0.0.1 ::1' and moved the files to the correct 'certs' directory.\n\n");
       process.exit(1);
   }
   ```

**4. Modify `package.json` Scripts:**

   Add a new script to your `package.json` to run this custom server. Binding to port 443 requires root privileges.

   ```json
   // package.json
   {
     "scripts": {
       "dev": "next dev",
       "dev:https": "sudo node server.js", // Added script
       "build": "next build",
       "start": "next start",
       "lint": "next lint"
     },
     // ... other configurations
   }
   ```
   *   **Note:** Using `sudo` is necessary for port 443. Be cautious when running commands with `sudo`.

**5. Run the Development Server:**

   Instead of `npm run dev`, use your new script:

   ```bash
   npm run dev:https
   # or
   yarn dev:https
   ```

   You will likely be prompted for your administrator password because of `sudo`. Once it starts, you should be able to access your application at `https://localhost:443`. Because you used `mkcert -install`, your browser should trust the certificate.

**Important Considerations:**

*   **Development Only:** This custom `server.js` and `mkcert` setup is strictly for **local development**.
*   **Production (Docker):** Your production Docker setup will be different. You will likely:
    *   Build your Next.js app (`next build`).
    *   Run it using `next start` inside the container (on a non-privileged port like 3000).
    *   Use a **reverse proxy** (like Nginx or Caddy) either in another container or on the host machine.
    *   Configure the reverse proxy to listen on port 443, handle the HTTPS termination using your **real** production certificate, and forward traffic to the Next.js container's port (e.g., 3000).
*   **Security:** Never commit your private key (`.pem` key file) to version control. Ensure your `certs/` directory is listed in `.gitignore`. Do not use your production certificates for local development.
*   **Port Conflicts:** Ensure no other service is already running on port 443 on your local machine.
