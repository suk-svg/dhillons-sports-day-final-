import Head from 'next/head'
import dynamic from 'next/dynamic'

const SportsApp = dynamic(() => import('../components/SportsApp'), {
  ssr: false,
})

export default function Home() {
  return (
    <>
      <Head>
        <title>Sports Day 2026 - Event Manager</title>
        <meta name="description" content="Professional Sports Event Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SportsApp />
    </>
  )
}
