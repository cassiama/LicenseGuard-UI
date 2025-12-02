import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { getAnalysisStream } from '../services/api';
import { useAuth } from '../contexts/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileUpload } from '../components/ui/file-upload';
import { Header } from '../components/ui/header';
import { Loader2, AlertCircle } from 'lucide-react';

export const MainPage = () => {
  const { logout } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    // clear the previous analysis when a new file is selected
    setAnalysisResult("");
    setError(null);
  };

  const handleSubmit = async () => {
      if (!file || !projectName) {
        setError("Please provide a project name and a requirements.txt file.");
        return;
      }

      setIsLoading(true);
      setError(null);
      // clear the previous analysis when a new file is selected
      setAnalysisResult("");

      try {
        await getAnalysisStream(
          projectName,
          file,
          (chunk) => {
            setAnalysisResult((prev) => prev + chunk);
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onLogout={logout} />

      <main className="max-w-4xl p-8 mx-auto">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Analyze New Project</h1>
          <p className="text-gray-400">
            Start by entering your project details and uploading your requirements.txt file.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Form */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Project Name</label>
            <Input
              type="text"
              placeholder="MyReallyAwesomeApp"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Requirements File</label>
            <FileUpload onChange={handleFileChange} />
          </div>

          {/* Analyze Button */}
          <div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !file || !projectName}
              className={"w-48 shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_0_rgba(0,0,0,0.30)]" + (isLoading ? " hidden" : " block")}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
        </div>

        {/* Displaying Errors */}
        {error && (
          <div className="mt-8 p-4 text-red-300 bg-red-900/50 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            <p><span className="text-bold">Error:</span> {error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {/* this is shown ONLY if we are loading BUT haven't received any text yet. this is because we need to wait for the time when the agent is running the 'call_tool' node. */}
        {isLoading && !analysisResult && (
          <div className="mt-8 p-8 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-center animate-pulse">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-white">Analyzing Dependencies...</h3>
            <p className="text-gray-400 text-sm mt-2">
              Checking licenses and verifying conflicts against the database.
            </p>
          </div>
        )}
        {/* this is shown when we have ANY content. we don't check if it's not loading because we want to see the text while it is still streaming. */}
        {analysisResult && (
          <div className="mt-8">
            {/* small indicator that the stream is still active */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Analysis Result</h2>
              {isLoading && (
                <span className="flex items-center text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Generating Report...
                </span>
              )}
            </div>
            {/* the generated analysis report formatted in Markdown */}
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-lg text-gray-300 space-y-4">
              <ReactMarkdown
                components={{
                  // style the H2 ("##" type shit)
                  h2: ({ ...props }) => (
                    <h2 className="text-2xl font-bold text-blue-400 mt-6 mb-3 border-b border-gray-700 pb-2" {...props} />
                  ),
                  // style the H3 ("###" type shit)
                  h3: ({ ...props }) => (
                    <h3 className="text-xl font-semibold text-white mt-4 mb-2 flex items-center gap-2" {...props} />
                  ),
                  // style the Lists
                  ul: ({ ...props }) => (
                    <ul className="list-disc list-outside space-y-1 ml-4" {...props} />
                  ),
                  li: ({ ...props }) => (
                    <li className="text-gray-300 marker:text-blue-500" {...props} />
                  ),
                  // style the bold text ("**" type shit)
                  strong: ({ ...props }) => (
                    <strong className="font-bold text-blue-200" {...props} />
                  ),
                  // style the code fence text (`package`)
                  code: ({ className, children, ...props }) => {
                    // check if it's an inline code snippet or a block
                    const match = /language-(\w+)/.exec(className || '')
                    return !match ? (
                      <code className="bg-gray-900 text-yellow-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      // otherwise, just use the HTML tags for code blocks
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
