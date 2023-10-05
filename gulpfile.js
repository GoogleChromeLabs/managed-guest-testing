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

const { series, parallel, src, dest } = require('gulp');
const exec = require('child_process').exec;

/**
 * Deploy the code to the Apps Script Container.
 * @param {function} cb Callback function
 */
function deployWebapp(cb) {
  exec('"clasp" push --force', (err, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);
    cb(err);
  });
  cb();
}

/**
 * Move the Manifest to the deployment folder
 * @param {function} cb Callback function
 */
function processManifest(cb) {
  src('./server/appsscript.json').pipe(dest('deploy/'));
  cb();
}


function processServerFiles(cb) {
  src('./server/*.*').pipe(dest('deploy/server/'));
  cb();
}



exports.deploy = parallel(deployWebapp);
exports.build = series(
  processServerFiles,
  processManifest);
