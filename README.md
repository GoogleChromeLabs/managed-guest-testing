Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

# Testing Method with ChromeOS Managed Guest Session

Managed guest session can be used to lock down the user session and provide only the tools needed. It works by adjusting the managed guest session settings for the organizational unit  where the devices are located.

Below are the domains that need to be entered as blocklist exceptions to create this experience.

The blocklist can be set to * to prevent all other Chromebook web and network activities. There are further settings that can be applied to ensure a secure environment (for example: turning off developer tools, turning off incognito mode, etc.)

Here are the blocklist exceptions to use for Sign In:

```
accounts.google.com
accounts.google.ca
accounts.youtube.com
www.google.com/accounts
googleusercontent.com
docs.google.com/accounts
https://docs.google.com/accounts
google.com/settings/interstitials/twosvupgrade
myaccount.google.com

drive.google.com/u/0/uc
drive.google.com/accounts/SetOSID
drive.google.com/u/0/nonceSigner
```

Here are the blocklist exceptions to use for saving content locally and allowing the new page tab to load:

```
chrome://file-manager
chrome://new-tab-page
chrome://media-app
chrome-untrusted://media-app
```

Sample application URLs (for the Usito dictionary and a calculator):
```
https://usito.usherbrooke.ca
calculator.apps.chrome
apps.google.com
```

Sample published public exam, or you can share an exam to users at the time of test-taking and require they login:

```
https://docs.google.com/document/d/e/2PACX-1vTSPzn_-YbK0PL4lZ1VeLO7ax_NN5owfZTm2eYyf9LxazpDR853brhIhYddTmv05tvmRB7cpdj6-XVz/pub
```

Use an upload tool such as "Upload Files to Google Drive with Google Apps Script". After deployment, allowlist the published Apps Script url. If shared as available to your domain only, you will need the www.google.com/a/{domainname} included in the exceptions list. You can check all the urls needed using an incognito window and the developer tools to view network requests. Needed urls which are not in the exceptions list will show as blocked. Evaluate each for relevant use in the exam situation. The inner content urls do not need to be allowed, only the parent web requests.

```
https://script.google.com/.....
www.google.com/a/{domain}
```

Lastly, review all Managed Guest Mode settings and ensure the sessions are locked down and any Chrome extensions are provisioned for those who may need them (for example: supplementary accessibility tools), allowing only url access needed for exam taking.

# Installation
[Sheet Template for Management](https://docs.google.com/spreadsheets/d/1Z6uDKzpxIrBkg64SP-mcs4VleHkyUB-YqQNVMcLhfxE/copy)

1. Clone this git repository.
2. Create a new Google Script by accessing https://script.new
3. Label your script and get the Script ID from the settings.
4. Add the Script ID to the .clasp.json file.
5. In the Code.js file add the Folder ID and the ID of the Sheet you copied.
6. Install NPM packages.
7. Ensure you have [Clasp](https://developers.google.com/apps-script/guides/clasp) installed.
8. Build the deployment with
```
gulp build
```
9. Deploy with
```
gulp deploy
```

*Google Forms File Picker requires access to the user's Google Drive. This web app written in Apps Script will work to put content in the deployer's Google Drive. Set the run as to be yourself and allow on the domain.
