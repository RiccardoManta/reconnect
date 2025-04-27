import type { AppProps } from 'next/app';
import { SessionProvider } from "next-auth/react";
import '../src/app/globals.css'; // Assuming your global styles are here

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    // `session` comes from `getServerSideProps` or `getInitialProps`. 
    // Avoids flickering/session loading on initial load.
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp; 