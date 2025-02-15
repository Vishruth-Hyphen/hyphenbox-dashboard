'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Walkthrough {
  id: string
  title: string
  markdown_url: string
  created_at: string
  markdown_content?: string
}

export default function WalkthroughsPage() {
  const [walkthroughs, setWalkthroughs] = useState<Walkthrough[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWalkthrough, setSelectedWalkthrough] = useState<Walkthrough | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndFetchWalkthroughs() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }

      try {
        const { data, error } = await supabase
          .from('walkthroughs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch markdown content for each walkthrough
        const walkthroughsWithContent = await Promise.all(
          (data || []).map(async (walkthrough) => {
            try {
              const response = await fetch(walkthrough.markdown_url)
              const markdown_content = await response.text()
              return { ...walkthrough, markdown_content }
            } catch (error) {
              console.error(`Error fetching markdown for ${walkthrough.id}:`, error)
              return walkthrough
            }
          })
        )

        setWalkthroughs(walkthroughsWithContent)
      } catch (error) {
        console.error('Error fetching walkthroughs:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchWalkthroughs()
  }, [])

  const handleDownload = (walkthrough: Walkthrough) => {
    if (!walkthrough.markdown_content) return

    const blob = new Blob([walkthrough.markdown_content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${walkthrough.title || 'walkthrough'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Walkthroughs</h1>
      
      {walkthroughs.length === 0 ? (
        <p className="text-gray-500">No walkthroughs yet. Create one using the extension!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* List of walkthroughs */}
          <div className="space-y-4">
            {walkthroughs.map((walkthrough) => (
              <div 
                key={walkthrough.id} 
                className="border border-gray-700 rounded-lg p-4 bg-gray-800 cursor-pointer"
                onClick={() => setSelectedWalkthrough(walkthrough)}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{walkthrough.title}</h2>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(walkthrough)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Download
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Created: {new Date(walkthrough.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Markdown preview */}
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 min-h-[500px]">
            {selectedWalkthrough ? (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>
                  {selectedWalkthrough.markdown_content || 'Loading markdown content...'}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-500 flex items-center justify-center h-full">
                Select a walkthrough to view its content
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
