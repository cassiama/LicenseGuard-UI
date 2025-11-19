import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { getAnalysisStream } from '../services/api';
import { useAuth } from '../contexts/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileUpload } from '../components/ui/file-upload'; // Using your component
import { Header } from '../components/ui/header';       // Using your component
import { Loader2, FileText, AlertCircle } from 'lucide-react';

export const MainPage = () => {
  const { logout } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    // When a new file is selected, clear the previous results
    setAnalysisResult('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || !projectName) {
      setError('Please provide a project name and a requirements.txt file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(''); // Clear previous results

    try {
      await getAnalysisStream(
        projectName,
        file,
        (chunk) => {
          setAnalysisResult((prev) => prev + chunk);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Assuming your Header component takes a 'onLogout' prop.
        If not, you can build the logout logic right here.
      */}
      <Header onLogout={logout} />

      <main className="max-w-4xl p-8 mx-auto">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Analyze New Project</h1>
          <p className="text-gray-400">
            Start by entering your project details and uploading your requirements.txt file.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* --- Form Section --- */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Project Name</label>
            <Input
              type="text"
              placeholder="e.g., My Awesome App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* --- File Upload Section --- */}
          {/* This logic matches your wireframe:
              - If no file is uploaded OR we are loading, show the file-upload component.
              - If a file IS uploaded AND we are NOT loading AND we have results, show the badge.
          */}
          {(!analysisResult || isLoading) && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Requirements File</label>
              {/* Assuming your FileUpload component has an onChange prop.
                Adjust this prop name based on your component's API.
              */}
              <FileUpload onChange={handleFileChange} />
            </div>
          )}

          {/* This is the "Success" state badge from your wireframe */}
          {analysisResult && !isLoading && file && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Requirements File</label>
              <div className="flex items-center p-3 rounded-md bg-gray-700 max-w-md">
                <FileText className="w-5 h-5 mr-3 text-gray-300" />
                <span className="font-medium">{file.name}</span>
              </div>
            </div>
          )}

          {/* --- Analyze Button --- */}
          <div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !file || !projectName}
              className={"w-48 shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_0_rgba(0,0,0,0.30)]" + (isLoading ? " hidden" : " block")}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </div>

        {/* --- Error Display --- */}
        {error && (
          <div className="mt-8 p-4 text-red-300 bg-red-900/50 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {/* --- Results Section (Success State) --- */}
        {/* Show this ONLY if we are loading BUT haven't received any text yet. 
        This covers the time the agent is running the 'call_tool' node. */}
        {isLoading && !analysisResult && (
          <div className="mt-8 p-8 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-center animate-pulse">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-white">Analyzing Dependencies...</h3>
            <p className="text-gray-400 text-sm mt-2">
              Checking licenses and verifying conflicts against the database.
            </p>
          </div>
        )}
        {/* Show this as soon as we have ANY content (analysisResult is truthy). 
            We do NOT check !isLoading here, because we want to see the text 
            while it is still streaming. */}
        {analysisResult && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Analysis Result</h2>
              {/* Optional: A small indicator that the stream is still active */}
              {isLoading && (
                <span className="flex items-center text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Generating Report...
                </span>
              )}
            </div>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-lg text-gray-300 space-y-4">
              <ReactMarkdown
                components={{
                  // Style the H2 (##)
                  h2: ({ ...props }) => (
                    <h2 className="text-2xl font-bold text-blue-400 mt-6 mb-3 border-b border-gray-700 pb-2" {...props} />
                  ),
                  // Style the H3 (###)
                  h3: ({ ...props }) => (
                    <h3 className="text-xl font-semibold text-white mt-4 mb-2 flex items-center gap-2" {...props} />
                  ),
                  // Style the Lists
                  ul: ({ ...props }) => (
                    <ul className="list-disc list-outside space-y-1 ml-4" {...props} />
                  ),
                  li: ({ ...props }) => (
                    <li className="text-gray-300 marker:text-blue-500" {...props} />
                  ),
                  // Style the Bold text
                  strong: ({ ...props }) => (
                    <strong className="font-bold text-blue-200" {...props} />
                  ),
                  // Style the Code snippets (`package`)
                  code: ({ className, children, ...props }) => {
                    // Check if it's an inline code snippet or a block
                    const match = /language-(\w+)/.exec(className || '')
                    return !match ? (
                      <code className="bg-gray-900 text-yellow-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      // Fallback for code blocks if you have them
                      <pre className="bg-gray-950 p-4 rounded-lg overflow-x-auto">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    )
                  }
                }}
              >
                {analysisResult}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};