variable "environment" {
  description = "One of staging, prod-us, or prod-eu."
  type        = string
  validation {
    condition     = contains(["staging", "prod-us", "prod-eu"], var.environment)
    error_message = "environment must be staging, prod-us, or prod-eu"
  }
}

variable "region" {
  description = "Tenant data-plane region."
  type        = string
  validation {
    condition     = contains(["us", "eu"], var.region)
    error_message = "region must be us or eu"
  }
}

variable "cloudflare_account_id" { type = string }
variable "cloudflare_zone_id" { type = string }
variable "neon_org_id" { type = string }
variable "vercel_team_id" { type = string }
