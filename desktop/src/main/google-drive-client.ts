import axios from 'axios';
import fs from 'fs';

export interface DriveConfig {
  enabled: boolean;
  provider?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  rootFolderId?: string | null;
  rootFolderName?: string;
}

export async function uploadDirectToGoogleDrive(
  config: DriveConfig,
  filePath: string,
  fileName: string,
  mimeType: string,
  employeeName: string,
  capturedAtIso: string,
): Promise<{ fileId: string; viewUrl: string }> {
  if (!config.refreshToken) {
    throw new Error('Google Drive Refresh Token missing in configuration');
  }

  const clientId =
    config.clientId ||
    '1084224734568-dummyclientid.apps.googleusercontent.com';
  const clientSecret = config.clientSecret || 'dummyclientsecret';

  // 1. Get Google Access Token using Refresh Token
  const tokenRes = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10_000,
    },
  );

  const googleAccessToken = tokenRes.data?.access_token;
  if (!googleAccessToken) {
    throw new Error('Failed to obtain Google access token from OAuth service');
  }

  const headers = { Authorization: `Bearer ${googleAccessToken}` };

  // 2. Format Date Folder (DD-MM-YYYY)
  const captureDate = new Date(capturedAtIso);
  const day = String(captureDate.getDate()).padStart(2, '0');
  const month = String(captureDate.getMonth() + 1).padStart(2, '0');
  const year = captureDate.getFullYear();
  const dateFolderName = `${day}-${month}-${year}`;

  // Helper to find or create folder in Google Drive
  const ensureFolder = async (folderName: string, parentId?: string): Promise<string> => {
    const escaped = folderName.replace(/['\\]/g, '\\$&');
    const parentClause = parentId ? ` and '${parentId}' in parents` : '';
    const searchRes = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers,
      params: {
        q: `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`,
        fields: 'files(id)',
        pageSize: 1,
      },
      timeout: 10_000,
    });

    if (searchRes.data?.files?.[0]?.id) {
      return searchRes.data.files[0].id;
    }

    const createRes = await axios.post(
      'https://www.googleapis.com/drive/v3/files',
      {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      { headers, timeout: 10_000 },
    );

    if (!createRes.data?.id) throw new Error(`Could not create Drive folder: ${folderName}`);
    return createRes.data.id;
  };

  // 3. Ensure Folder Hierarchy: RootFolder / DD-MM-YYYY / EmployeeName
  let parentId = config.rootFolderId || undefined;
  if (!parentId) {
    parentId = await ensureFolder(config.rootFolderName || 'ScreenAdvait Screenshots');
  }
  const dateFolderId = await ensureFolder(dateFolderName, parentId);
  const employeeFolderId = await ensureFolder(employeeName || 'employee', dateFolderId);

  // 4. Upload File to Google Drive via Resilient Multipart Upload
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = `-------314159265358979323846${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = JSON.stringify({
    name: `${Date.now()}-${fileName}`,
    parents: [employeeFolderId],
  });

  const multipartBody = Buffer.concat([
    Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`,
    ),
    Buffer.from(`${delimiter}Content-Type: ${mimeType || 'image/png'}\r\n\r\n`),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ]);

  const uploadRes = await axios.post(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    multipartBody,
    {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
      },
      timeout: 45_000,
    },
  );

  const fileId = uploadRes.data?.id;
  if (!fileId) throw new Error('Google Drive file upload failed');
  const viewUrl =
    uploadRes.data?.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return { fileId, viewUrl };
}
