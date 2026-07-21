locals {
  name = "meminios-${var.environment}"
  tags = {
    product     = "meminios"
    environment = var.environment
    region      = var.region
    managed_by  = "terraform"
  }
}

# Resource modules are intentionally composed per environment after provider credentials,
# account IDs, domains, and Neon region IDs are supplied. Services receive database, R2,
# queue, and KMS endpoints through environment configuration; no module assumes co-location.

output "deployment_contract" {
  value = {
    name        = local.name
    region      = var.region
    data_plane  = ["database_endpoint", "object_store_endpoint", "queue_endpoint", "kms_endpoint"]
    deployables = ["landing-vercel", "web-cloudflare", "api-cloudflare", "container-workers"]
  }
}
