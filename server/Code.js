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
 * Send the Submission of an exam to the sheet as a log.
 *
 * @param {Array} row 1d array to be inserted to the sheet.
 */
function logSubmission(row) {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  const sheet = ss.getSheetByName('ExamSubmissions')
  sheet.appendRow(row)
}

/**
 * Upload the submitted file to the proper Drive Folder.
 * @param {string} data Base64 Data string.
 * @param {string} filename Name of the file to use.
 * @param {string} name Name of the user.
 * @param {string} email Email of the user.
 * @param {string} examcode Exam code.
 * @param {string} ip IP Address of the user.
 * @returns
 */
function uploadFileToGoogleDrive(data, filename, name, email, examcode, ip) {
  if (!examcode) return
  examcode = examcode.toLowerCase().trim()
  try {
    const folder = DriveApp.getFolderById(ROOT_EXAM_FOLDER_ID);
    if (!folder) return 'Missing root exam folder. Please setup'
    const examfolder = findChildFolderByName(folder, examcode)
    if (!examfolder) return 'Missing exam folder'

    let userFolder = findChildFolderByName(examfolder, [name, email].join(' '))
    if (!userFolder) {
      userFolder = examfolder.createFolder([name, email].join(' '))
      const id = userFolder.getId()
      const row = [email, name, `https://drive.google.com/open?id=${id}`,
        examcode, ip]
      logSubmission(row)
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
  if (!title || !folder) return
  title = title.toLowerCase().trim()
  let childfolder
  const childrenfolders = folder.getFolders()
  while (childrenfolders.hasNext()) {
    const childf = childrenfolders.next()
    if (childf.getName().toLowerCase().trim() == title) {
      childfolder = childf;
      break;
    }
  }
  return childfolder
}

/**
 * Return the exam link from the code and add the user accessing as a viewer.
 * @param {string} examcode
 * @param {string} email
 * @returns {string} examlink
 */
function getExamByCode(examcode, email) {
  if (!examcode) return
  examcode = examcode.toLowerCase().trim()
  const ss = SpreadsheetApp.openById(SHEET_ID)
  const sheet = ss.getSheetByName('Exams')
  const [head, ...data] = sheet.getDataRange().getValues()
  const row = data.filter(row => row[head.indexOf('Exam Code')].toLowerCase()
    .trim() == examcode)
  const examlink = row[0][head.indexOf('File Link')]
  if (examlink.includes('google.com')) {
    const id = getIdFromUrl(examlink)[0]
    const file = DriveApp.getFileById(id);
    file.addViewer(email)
  }
  return examlink
}

/**
 * Extracts the file id from a google file type an dreturns the match as an
 * array.
 * @param {string} url
 * @returns Array Match of File ID
 */
function getIdFromUrl(url) { return url.match(/[-\w]{25,}/); }

/**
 * Get the user's name form the Admin directory.
 * @param {string} email
 * @returns
 */
function getName(email) {
  const result = AdminDirectory.Users.get(email, { fields: 'name' });
  const fullname = result.name.fullName;
  return fullname;
}

/**
 * Get the Activly logged in user's email.
 * @returns Active User's email
 */
function email() {
  return Session.getActiveUser().getEmail()
}
