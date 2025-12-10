# Testing & Development Archive

This directory contains all testing scripts, development notes, session summaries, and test data created during the development and refinement of Sales Studio.

## Contents

### Session Summaries
- `session-*.txt` - Summary of work completed in each development session
- `session-*-FINAL-SUMMARY.txt` - Final session summaries
- `session-*-notes.txt` - Session-specific notes and discoveries

### Test Scripts (.mjs files)
NodeJS/Bun scripts used for testing and verification:
- `test-*.mjs` - Feature and validation tests
- `check-*.mjs` - Verification and health check scripts
- `create-*.mjs` - Scripts to create test data
- `import-*.mjs` - Census import test scripts
- `update-*.mjs` - Status update tests
- `verify-*.mjs` - Verification workflow tests
- And many others for specific feature testing

### Test Data
- `test-*.csv` - Sample census data files for testing various scenarios
  - Valid data files
  - Files with missing values
  - Files with invalid formats
  - Files with invalid dates/zips
  - Large datasets (10k+ rows)
  - Edge case scenarios

### Documentation
- `feature-*.md` - Detailed documentation of specific features
- `*.txt` - Development notes and specifications
- `test-verification-notes.md` - Verification process documentation

## Purpose

These files served critical roles during development:

1. **Validation Testing** - Ensuring census validation logic correctly identifies PEO and ACA data quality issues
2. **Feature Testing** - Verifying new features work end-to-end
3. **Data Testing** - Testing with various data scenarios and edge cases
4. **Integration Testing** - Testing multiple features working together
5. **Performance Testing** - Testing with large datasets
6. **Session Documentation** - Recording progress and decisions in each session

## Notes

- These files are archived for reference and historical context
- Test scripts may reference specific client IDs or data that no longer exists
- For current development, refer to the main codebase documentation (CLAUDE.md, FEATURES.md, IMPLEMENTATION_STATUS.md)
- Session summaries provide useful context on feature decisions and design choices

---

**Maintained as part of Sales Studio's development archive**
