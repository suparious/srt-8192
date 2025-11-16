#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build and push Docker images for the 8192 game application.

.DESCRIPTION
    Builds all Docker images for the 8192 game microservices architecture:
    - Base service image (used by all backend services)
    - Backend microservices (12+ services)
    - Frontend React application

    Supports cross-platform paths (WSL2 + Windows) and GitHub Container Registry push.

.PARAMETER Push
    Push images to GitHub Container Registry after building

.PARAMETER Login
    Interactive GitHub Container Registry login before build

.PARAMETER SkipBase
    Skip building the base service image (use existing)

.PARAMETER ServiceOnly
    Build only a specific service (e.g., "api-gateway", "frontend")

.EXAMPLE
    .\build-and-push.ps1
    Build all images locally

.EXAMPLE
    .\build-and-push.ps1 -Login -Push
    Login to GitHub Container Registry, build and push all images

.EXAMPLE
    .\build-and-push.ps1 -ServiceOnly frontend
    Build only the frontend image
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$Push,

    [Parameter(Mandatory=$false)]
    [switch]$Login,

    [Parameter(Mandatory=$false)]
    [switch]$SkipBase,

    [Parameter(Mandatory=$false)]
    [string]$ServiceOnly
)

#region Configuration
$ErrorActionPreference = "Stop"

# GitHub Container Registry configuration
$DOCKER_USER = "suparious"
$IMAGE_PREFIX = "srt-8192"
$IMAGE_TAG = "latest"

# Service definitions
$BACKEND_SERVICES = @(
    "api-gateway",
    "game-logic-service",
    "ai-service",
    "data-integration",
    "economy-management",
    "leaderboard-service",
    "matchmaking-service",
    "notification-service",
    "persistence-service",
    "rewards-service",
    "social-service",
    "tutorial-service",
    "user-service"
)

# Color output functions
function Write-ColorOutput {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,

        [Parameter(Mandatory=$false)]
        [string]$Color = "White"
    )

    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColorOutput "✅ $Message" "Green" }
function Write-Info { param([string]$Message) Write-ColorOutput "ℹ️  $Message" "Cyan" }
function Write-Warning { param([string]$Message) Write-ColorOutput "⚠️  $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorOutput "❌ $Message" "Red" }
function Write-Header { param([string]$Message) Write-ColorOutput "`n=== $Message ===" "Magenta" }

#endregion

#region Functions

function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    } catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        return $false
    }
}

function Invoke-DockerLogin {
    Write-Header "GitHub Container Registry Login"
    try {
        docker login ghcr.io
        Write-Success "Logged in to GitHub Container Registry"
    } catch {
        Write-Error "Docker login failed: $($_.Exception.Message)"
        exit 1
    }
}

function Build-BaseImage {
    Write-Header "Building Base Service Image"

    $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-base:${IMAGE_TAG}"
    $contextPath = "./backend/services/base"

    Write-Info "Building: $imageName"
    Write-Info "Context: $contextPath"

    docker build -t $imageName $contextPath
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Base image built: $imageName"
        return $true
    } else {
        Write-Error "Failed to build base image (exit code: $LASTEXITCODE)"
        return $false
    }
}

function Build-BackendService {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ServiceName
    )

    $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-${ServiceName}:${IMAGE_TAG}"
    $contextPath = "./backend/services/${ServiceName}"

    if (-not (Test-Path $contextPath)) {
        Write-Warning "Service directory not found: $contextPath (skipping)"
        return $false
    }

    Write-Info "Building: $imageName"
    Write-Info "Context: $contextPath"

    # Build with base image reference
    docker build -t $imageName --build-arg BASE_IMAGE="${DOCKER_USER}/${IMAGE_PREFIX}-base:${IMAGE_TAG}" $contextPath
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Built: $imageName"
        return $true
    } else {
        Write-Error "Failed to build $ServiceName (exit code: $LASTEXITCODE)"
        return $false
    }
}

function Build-Frontend {
    Write-Header "Building Frontend Image"

    $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-frontend:${IMAGE_TAG}"
    $contextPath = "./frontend"

    Write-Info "Building: $imageName"
    Write-Info "Context: $contextPath"

    docker build -t $imageName $contextPath
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Built: $imageName"
        return $true
    } else {
        Write-Error "Failed to build frontend (exit code: $LASTEXITCODE)"
        return $false
    }
}

function Push-Image {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ImageName
    )

    Write-Info "Pushing: $ImageName"

    docker push $ImageName
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pushed: $ImageName"
        return $true
    } else {
        Write-Error "Failed to push $ImageName (exit code: $LASTEXITCODE)"
        return $false
    }
}

#endregion

#region Main Script

Write-Header "8192 Game - Docker Build Script"

# Check Docker
if (-not (Test-DockerRunning)) {
    exit 1
}

# Login if requested
if ($Login) {
    Invoke-DockerLogin
}

# Track results
$builtImages = @()
$failedBuilds = @()
$pushedImages = @()
$failedPushes = @()

# Build single service if specified
if ($ServiceOnly) {
    Write-Header "Building Single Service: $ServiceOnly"

    if ($ServiceOnly -eq "frontend") {
        if (Build-Frontend) {
            $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-frontend:${IMAGE_TAG}"
            $builtImages += $imageName

            if ($Push) {
                if (Push-Image $imageName) {
                    $pushedImages += $imageName
                } else {
                    $failedPushes += $imageName
                }
            }
        } else {
            $failedBuilds += "frontend"
        }
    } elseif ($ServiceOnly -eq "base") {
        if (Build-BaseImage) {
            $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-base:${IMAGE_TAG}"
            $builtImages += $imageName

            if ($Push) {
                if (Push-Image $imageName) {
                    $pushedImages += $imageName
                } else {
                    $failedPushes += $imageName
                }
            }
        } else {
            $failedBuilds += "base"
        }
    } elseif ($BACKEND_SERVICES -contains $ServiceOnly) {
        if (Build-BackendService $ServiceOnly) {
            $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-${ServiceOnly}:${IMAGE_TAG}"
            $builtImages += $imageName

            if ($Push) {
                if (Push-Image $imageName) {
                    $pushedImages += $imageName
                } else {
                    $failedPushes += $imageName
                }
            }
        } else {
            $failedBuilds += $ServiceOnly
        }
    } else {
        Write-Error "Unknown service: $ServiceOnly"
        exit 1
    }
} else {
    # Build all images

    # 1. Build base image first (required by all backend services)
    if (-not $SkipBase) {
        if (Build-BaseImage) {
            $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-base:${IMAGE_TAG}"
            $builtImages += $imageName

            if ($Push) {
                if (Push-Image $imageName) {
                    $pushedImages += $imageName
                } else {
                    $failedPushes += $imageName
                }
            }
        } else {
            $failedBuilds += "base"
            Write-Error "Base image build failed. Cannot continue with backend services."
            exit 1
        }
    } else {
        Write-Info "Skipping base image build (using existing)"
    }

    # 2. Build all backend services
    Write-Header "Building Backend Services"
    foreach ($service in $BACKEND_SERVICES) {
        if (Build-BackendService $service) {
            $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-${service}:${IMAGE_TAG}"
            $builtImages += $imageName

            if ($Push) {
                if (Push-Image $imageName) {
                    $pushedImages += $imageName
                } else {
                    $failedPushes += $imageName
                }
            }
        } else {
            $failedBuilds += $service
        }
    }

    # 3. Build frontend
    if (Build-Frontend) {
        $imageName = "${DOCKER_USER}/${IMAGE_PREFIX}-frontend:${IMAGE_TAG}"
        $builtImages += $imageName

        if ($Push) {
            if (Push-Image $imageName) {
                $pushedImages += $imageName
            } else {
                $failedPushes += $imageName
            }
        }
    } else {
        $failedBuilds += "frontend"
    }
}

# Print summary
Write-Header "Build Summary"

Write-Info "Built Images: $($builtImages.Count)"
foreach ($image in $builtImages) {
    Write-Success "  $image"
}

if ($failedBuilds.Count -gt 0) {
    Write-Warning "Failed Builds: $($failedBuilds.Count)"
    foreach ($failed in $failedBuilds) {
        Write-Error "  $failed"
    }
}

if ($Push) {
    Write-Info "Pushed Images: $($pushedImages.Count)"
    foreach ($image in $pushedImages) {
        Write-Success "  $image"
    }

    if ($failedPushes.Count -gt 0) {
        Write-Warning "Failed Pushes: $($failedPushes.Count)"
        foreach ($failed in $failedPushes) {
            Write-Error "  $failed"
        }
    }
}

# Exit with error if any builds failed
if ($failedBuilds.Count -gt 0) {
    Write-Error "`nBuild completed with errors"
    exit 1
} else {
    Write-Success "`n✅ Build completed successfully!"
    exit 0
}

#endregion
