'use client'

import React, { useState } from 'react'
import { Upload, FileCode, AlertCircle, CheckCircle, Info, Zap, Shield, Eye, Code, ArrowRight } from 'lucide-react'
import { FrameworkSelector } from '../components/framework-selector'

export default function ReviewPage() {
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState('')
  const [framework, setFramework] = useState('react')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<any>(null)
  const [error, setError] = useState('')

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' }
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        setCode(event.target?.result as string)
      }
      reader.readAsText(uploadedFile)
      setError('')
      setReview(null)
    }
  }

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Please upload a code file or paste code to review')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, framework }),

      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.content && data.content[0]) {
        const reviewText = data.content[0].text
        const cleanedText = reviewText.replace(/```json|```/g, '').trim()
        const reviewData = JSON.parse(cleanedText)
        setReview(reviewData)
      } else {
        setError('Failed to get review from AI')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'codeQuality': return <FileCode className="w-5 h-5" />
      case 'bestPractices': return <CheckCircle className="w-5 h-5" />
      case 'performance': return <Zap className="w-5 h-5" />
      case 'accessibility': return <Eye className="w-5 h-5" />
      case 'security': return <Shield className="w-5 h-5" />
      default: return <Info className="w-5 h-5" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const categoryLabels: Record<string, string> = {
    codeQuality: 'Code Quality',
    bestPractices: 'Best Practices',
    performance: 'Performance',
    accessibility: 'Accessibility',
    security: 'Security'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Code Review</h1>
          <p className="text-gray-600">Upload your frontend code for instant AI-powered review with fixes</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div>


              <h3 className="text-lg font-bold text-heading text-gray-700 mb-5">Choose framework/library:</h3>
              <FrameworkSelector value={framework} onChange={setFramework} />


            </div>

          </div>

          <div className="mb-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-600"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <button
            onClick={analyzeCode}
            disabled={loading || !code.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing Code...
              </>
            ) : (
              'Analyze Code'
            )}
          </button>
        </div>

        {review && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Results</h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700">{review.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(review).map(([key, value]: [string, any]) => {
                  if (key === 'summary' || key === 'codeFixes' || typeof value !== 'object') return null

                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getCategoryIcon(key)}
                          <h3 className="font-semibold text-gray-900 ml-2">
                            {categoryLabels[key]}
                          </h3>
                        </div>
                        <span className={`text-2xl font-bold ${getScoreColor(value.score)}`}>
                          {value.score}/10
                        </span>
                      </div>

                      {value.issues && value.issues.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-red-600 mb-1">Issues:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {value.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-red-500 mr-2">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {value.strengths && value.strengths.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-green-600 mb-1">Strengths:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {value.strengths.map((strength: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {value.improvements && value.improvements.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-blue-600 mb-1">Improvements:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {value.improvements.map((improvement: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {value.recommendations && value.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-purple-600 mb-1">Recommendations:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {value.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-purple-500 mr-2">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {review.codeFixes && review.codeFixes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <Code className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Code Fixes & Improvements</h2>
                </div>

                <div className="space-y-6">
                  {review.codeFixes.map((fix: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-5">
                      <div className="flex items-start mb-4">
                        <div className="bg-orange-100 rounded-full p-2 mr-3 mt-1">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {fix.issue}
                          </h3>
                          <p className="text-gray-600 text-sm">{fix.explanation}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-red-600">❌ Before</span>
                            <button
                              onClick={() => copyToClipboard(fix.before)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="bg-red-50 border border-red-200 rounded-lg p-3 overflow-x-auto">
                            <code className="text-sm text-gray-800 font-mono">{fix.before}</code>
                          </pre>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-green-600">✅ After</span>
                            <button
                              onClick={() => copyToClipboard(fix.after)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="bg-green-50 border border-green-200 rounded-lg p-3 overflow-x-auto">
                            <code className="text-sm text-gray-800 font-mono">{fix.after}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <ArrowRight className="w-4 h-4 mr-1" />
                        <span>Apply this fix to improve your code quality</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}