# PrepPad Repository Structure

## Current Repository Structure

The repository currently contains a mixed structure with several directories and branches:

```
sdlcgrp5/prepPad/
├── .github/
│   └── workflows/   # CI/CD workflow definitions
├── Documentation/   # Project documentation
├── module-tests/    # Contains backend code
├── frontend/        # Empty directory for frontend (newly created)
├── backend/         # Empty directory for backend (newly created)
├── .DS_Store
└── README.md
```

### Key Components

1. **module-tests/**: Currently contains the backend implementation code
2. **Frontend Code**: Currently not in a dedicated directory (or may be in a separate branch)
3. **.github/workflows/**: Contains CI/CD workflow definitions for GitHub Actions
4. **Documentation/**: Contains project documentation files

### Active Branches

- **main**: Primary branch
- **frontend**: Contains frontend-related code
- **module-tests**: Contains backend testing code
- **organize-repo**: Created to implement improved repository structure

## Proposed Organized Structure

The proposed structure aims to create a cleaner, more standardized repository organization:

```
sdlcgrp5/prepPad/
├── .github/
│   └── workflows/
│       ├── frontend-ci-cd.yml   # Frontend CI/CD workflow
│       └── backend-ci-cd.yml    # Backend CI/CD workflow
├── frontend/                    # All frontend code
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile               # Frontend Docker configuration
├── backend/                     # All backend code (migrated from module-tests)
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── Dockerfile               # Backend Docker configuration
├── Documentation/
│   ├── architecture.md
│   ├── deployment.md
│   └── repository-structure.md  # This document
└── README.md                    # Project overview
```

## Migration Plan

To transition from the current structure to the proposed organized structure:

1. **Team Discussion**: Agree on standardized structure in the upcoming meeting
2. **Code Migration**:
   - Move backend code from `module-tests/` to `backend/`
   - Consolidate frontend code into `frontend/` directory
3. **CI/CD Updates**:
   - Update workflow files to target the correct directories
   - Create Dockerfiles in appropriate locations
4. **Documentation Updates**:
   - Update README with clear project description
   - Document architecture, deployment process, and codebase structure

## DevOps Implementation

The repository will use:
- GitHub Actions for CI/CD pipelines
- Docker for containerization
- Azure for deployment infrastructure

This structure supports modern DevOps practices including:
- Continuous Integration
- Continuous Deployment
- Infrastructure as Code
- Container-based deployment

## Next Steps

1. Review this structure in tomorrow's team meeting
2. Decide on final structure
3. Create implementation plan with clear timeline
4. Update documentation based on decisions
