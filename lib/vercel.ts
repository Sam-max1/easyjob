// lib/vercel.ts
// Vercel REST API integration for automated proof-of-work project deployment

interface VercelFile {
  file: string;
  data: string;
  encoding?: "utf-8" | "base64";
}

interface VercelDeployment {
  id: string;
  url: string;
  readyState: "QUEUED" | "BUILDING" | "ERROR" | "CANCELED" | "READY" | "INITIALIZING";
  alias?: string[];
}

const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

/**
 * Deploy a set of files to Vercel and return the public URL.
 * Falls back to a mock sandbox URL on any failure.
 */
export async function deployProject(
  files: Record<string, string>,
  projectName: string
): Promise<{ url: string; isFallback: boolean }> {
  if (!VERCEL_TOKEN) {
    console.warn("[vercel] VERCEL_API_TOKEN not set — using mock URL");
    return { url: generateMockUrl(projectName), isFallback: true };
  }

  try {
    // Build Vercel file payload
    const vercelFiles: VercelFile[] = Object.entries(files).map(
      ([filename, content]) => ({
        file: filename,
        data: content,
        encoding: "utf-8",
      })
    );

    // Sanitize project name for Vercel
    const sanitizedName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 52);

    const deployPayload = {
      name: sanitizedName,
      files: vercelFiles,
      projectSettings: {
        framework: "nextjs",
        buildCommand: "next build",
        outputDirectory: ".next",
        devCommand: "next dev",
      },
      target: "production",
    };

    const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    const createRes = await fetch(`${VERCEL_API}/v13/deployments${teamQuery}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deployPayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Vercel deployment creation failed: ${errText}`);
    }

    const deployment: VercelDeployment = await createRes.json();
    const deploymentId = deployment.id;

    // Poll for ready state (max 60 seconds)
    const readyUrl = await pollDeployment(deploymentId);
    return { url: readyUrl, isFallback: false };
  } catch (err) {
    console.error("[vercel] Deployment failed, using fallback:", err);
    return { url: generateMockUrl(projectName), isFallback: true };
  }
}

/**
 * Poll a Vercel deployment until it reaches READY state or times out.
 */
async function pollDeployment(deploymentId: string): Promise<string> {
  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(pollInterval);

    const res = await fetch(
      `${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    );

    if (!res.ok) continue;

    const data: VercelDeployment = await res.json();

    if (data.readyState === "READY") {
      const alias = data.alias?.[0];
      return alias
        ? `https://${alias}`
        : `https://${data.url}`;
    }

    if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
      throw new Error(`Vercel deployment failed with state: ${data.readyState}`);
    }
  }

  throw new Error("Vercel deployment timed out after 60 seconds");
}

/**
 * Generate a mock sandbox URL when Vercel deployment is unavailable.
 */
function generateMockUrl(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `https://sandbox.easyjob.dev/${slug}-${suffix}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
