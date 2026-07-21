terraform {
  required_version = ">= 1.10.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.22.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "0.14.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "5.4.1"
    }
  }
}
