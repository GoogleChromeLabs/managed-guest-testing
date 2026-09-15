/* Copyright 2023 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License. */

const SHEET_ID = '<Sheet ID Managaing the Exams and Submissions>'
const ROOT_EXAM_FOLDER_ID = '<Replace with your Folder ID containing>'

/**
 * Server side get listener.
 *
 * @param {object} e HTTP Request.
 * @returns
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('formswithvideo.html')
    .setTitle('Google File Upload');
}

/**
/**
 * Neutralizes characters that can trigger formula execution in Google Sheets.
 * @param {*} val
 * @returns {*} Sanitized cell value.
 */
function sanitizeSheetCell(val) {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@') || trimmed.startsWith('\t') || trimmed.startsWith('\r')) {
      return "'" + val;
    }
  }
  return val;
}

/**
 * Send the Submission of an exam to the sheet as a log.
 * Sanitizes cell values to prevent formula injection.
 *
 * @param {Array} row 1d array to be inserted to the sheet.
 */
function logSubmission(row) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('ExamSubmissions');
  const sanitizedRow = Array.isArray(row) ? row.map(sanitizeSheetCell) : row;
  sheet.appendRow(sanitizedRow);
}

/**
 * Upload the submitted file to the proper Drive Folder.
 * Derives user identity server-side from active session to prevent spoofing and forgery.
 * @param {string} data Base64 Data string.
 * @param {string} filename Name of the file to use.
 * @param {string} [_clientName] Client-supplied name (ignored for security).
 * @param {string} [_clientEmail] Client-supplied email (ignored for security).
 * @param {string} examcode Exam code.
 * @param {string} ip IP Address of the user.
 * @returns
 */
function uploadFileToGoogleDrive(data, filename, _clientName, _clientEmail, examcode, ip) {
  if (!examcode) return;
  examcode = examcode.toLowerCase().trim();
  try {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) return 'Unauthorized: active session user required';
    let userName = '';
    try {
      userName = getName();
    } catch (e) {
      userName = userEmail;
    }
    const safeIp = typeof ip === 'string' ? ip.replace(/[^a-zA-Z0-9.:_-]/g, '') : '';

    const folder = DriveApp.getFolderById(ROOT_EXAM_FOLDER_ID);
    if (!folder) return 'Missing root exam folder. Please setup';
    const examfolder = findChildFolderByName(folder, examcode);
    if (!examfolder) return 'Missing exam folder';

    const folderTitle = [userName, userEmail].filter(Boolean).join(' ');
    let userFolder = findChildFolderByName(examfolder, folderTitle);
    if (!userFolder) {
      userFolder = examfolder.createFolder(folderTitle);
      const id = userFolder.getId();
      const row = [userEmail, userName, `https://drive.google.com/open?id=${id}`,
        examcode, safeIp];
      logSubmission(row);
    }

    const contentType = data.substring(5, data.indexOf(';')),
      bytes = Utilities.base64Decode(data.substr(data.indexOf('base64,') + 7)),
      blob = Utilities.newBlob(bytes, contentType, filename);
    userFolder.createFile(blob);
    return 'OK';
  } catch (f) {
    return f.toString();
  }
}

/**
 * Find the subfolder in a parent folder by title.
 * @param {Object} folder Google Drive folder.
 * @param {string} title Title of the sub folder.
 * @returns
 */
function findChildFolderByName(folder, title) {
  if (!title || !folder) return;
  title = title.toLowerCase().trim();
  let childfolder;
  const childrenfolders = folder.getFolders();
  while (childrenfolders.hasNext()) {
    const childf = childrenfolders.next();
    if (childf.getName().toLowerCase().trim() == title) {
      childfolder = childf;
      break;
    }
  }
  return childfolder;
}

/**
 * Return the exam link from the code and add the active user accessing as a viewer.
 * Ignores client-supplied email parameter to prevent IDOR / unauthorized ACL grants.
 * @param {string} examcode
 * @param {string} [_clientEmail] Client-supplied email (ignored for security).
 * @returns {string} examlink
 */
function getExamByCode(examcode, _clientEmail) {
  if (!examcode) return;
  examcode = examcode.toLowerCase().trim();
  const activeEmail = Session.getActiveUser().getEmail();
  if (!activeEmail) {
    throw new Error('Unauthorized: active user required');
  }
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Exams');
  const [head, ...data] = sheet.getDataRange().getValues();
  const row = data.filter(r => r[head.indexOf('Exam Code')].toLowerCase()
    .trim() == examcode);
  if (!row || row.length === 0) return null;
  const examlink = row[0][head.indexOf('File Link')];
  if (examlink && examlink.includes('google.com')) {
    const id = getIdFromUrl(examlink)[0];
    const file = DriveApp.getFileById(id);
    file.addViewer(activeEmail);
  }
  return examlink;
}

/**
 * Extracts the file id from a google file type and returns the match as an
 * array.
 * @param {string} url
 * @returns Array Match of File ID
 */
function getIdFromUrl(url) { return url.match(/[-\w]{25,}/); }

/**
 * Get the user's name from the Admin directory for the active session user only.
 * Ignores client-supplied email parameter to prevent tenant directory enumeration.
 * @param {string} [_clientEmail] Client-supplied email (ignored for security).
 * @returns {string} Full name of active user.
 */
function getName(_clientEmail) {
  const activeEmail = Session.getActiveUser().getEmail();
  if (!activeEmail) return '';
  try {
    const result = AdminDirectory.Users.get(activeEmail, { fields: 'name' });
    const fullname = result.name.fullName;
    return fullname;
  } catch (e) {
    return activeEmail;
  }
}

/**
 * Get the Actively logged in user's email.
 * @returns Active User's email
 */
function email() {
  return Session.getActiveUser().getEmail();
}
