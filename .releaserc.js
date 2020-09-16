module.exports = {
  branches: ["master"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/git", {
      "assets": ['CHANGELOG.md', 'package.json'],
    }],
    ["@semantic-release/exec", {
      "verifyConditionsCmd": "echo -n '0.0.0' > VERSION",
      "generateNotesCmd": "echo -n ${nextRelease.version} > VERSION && echo -n ${lastRelease.gitTag} > LAST_RELEASE_TAG",
    }]
  ],
};
