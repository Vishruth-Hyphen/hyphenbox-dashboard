export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Welcome to VoxiGuide</h1>
      <a 
        href="/auth" 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Login to Get Started
      </a>
    </div>
  )
}
