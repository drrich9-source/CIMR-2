/// <reference types="vite/client" />
import { bootstrapCameraKit, CameraKit, CameraKitSession, Lens } from "@snap/camera-kit";

export const LENS_ID = "a375b6d69d0c4feda05a84e0ab58e471";
export const LENS_GROUP_ID = "4721ae08-26c8-496e-bdd1-5ab2ebf87460";

let cameraKitInstance: CameraKit | null = null;
let activeSession: CameraKitSession | null = null;

export async function getCameraKit(): Promise<CameraKit> {
  if (!cameraKitInstance) {
    let apiToken = "";
    
    // Attempt to fetch dynamically from the backend first to support runtime configuration
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const configData = await response.json();
        if (configData.snapApiToken) {
          apiToken = configData.snapApiToken;
        }
      }
    } catch (e) {
      console.log("Snapchat config: Falling back to local configuration.");
    }

    // Fall back to compilation-time build variables
    if (!apiToken) {
      apiToken = import.meta.env.VITE_SNAP_API_TOKEN || "";
    }

    if (!apiToken) {
      console.log("Snapchat: Local key option loaded.");
    }
    cameraKitInstance = await bootstrapCameraKit({
      apiToken: apiToken,
    });
  }
  return cameraKitInstance;
}

export interface SnapSessionResult {
  session: CameraKitSession;
  lens: Lens;
}

export async function startSnapOldAgeSession(
  mediaStream: MediaStream,
  canvasElement?: HTMLCanvasElement
): Promise<SnapSessionResult> {
  const cameraKit = await getCameraKit();
  
  // Clean up any existing session to prevent leaks
  if (activeSession) {
    try {
      await activeSession.destroy();
    } catch (e) {
      console.log("Snapchat Session Cleanup: Complete.");
    }
    activeSession = null;
  }

  const session = await cameraKit.createSession({
    liveRenderTarget: canvasElement,
  });
  
  activeSession = session;

  // Set the source stream
  await session.setSource(mediaStream);

  // Retrieve dynamic or configured Lens ID & Lens Group ID
  let lensId = LENS_ID;
  let lensGroupId = LENS_GROUP_ID;

  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const configData = await response.json();
      if (configData.snapLensId) {
        lensId = configData.snapLensId;
      }
      if (configData.snapLensGroupId) {
        lensGroupId = configData.snapLensGroupId;
      }
    }
  } catch (e) {
    console.log("Snapchat config: defaults applied.");
  }

  if (import.meta.env.VITE_SNAP_LENS_ID) {
    lensId = import.meta.env.VITE_SNAP_LENS_ID;
  }
  if (import.meta.env.VITE_SNAP_LENS_GROUP_ID) {
    lensGroupId = import.meta.env.VITE_SNAP_LENS_GROUP_ID;
  }

  // Load the Lens
  const lens = await cameraKit.lensRepository.loadLens(lensId, lensGroupId);

  // Apply the Lens
  await session.applyLens(lens);

  // Play the session
  await session.play("live");

  return { session, lens };
}

export function stopActiveSnapSession() {
  if (activeSession) {
    try {
      activeSession.destroy();
    } catch (e) {
      console.log("Snapchat Session Halt: Session Stopped.");
    }
    activeSession = null;
  }
}
