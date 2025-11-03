#!/usr/bin/env Rscript

# Script to extract PREVENT equation coefficients from the preventr package
# and export them as JSON for use in JavaScript/TypeScript

cat("Installing and loading required packages...\n")

# Install preventr if not already installed
if (!requireNamespace("preventr", quietly = TRUE)) {
  install.packages("preventr", repos = "https://cloud.r-project.org/")
}

# Install jsonlite for JSON export
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", repos = "https://cloud.r-project.org/")
}

library(preventr)
library(jsonlite)

cat("Loading preventr internal data...\n")

# The preventr package stores coefficients in internal data
# We need to access the sysdata environment
pkg_env <- asNamespace("preventr")

# List all objects in the package environment
all_objects <- ls(pkg_env, all.names = TRUE)
cat("Objects found in preventr package:\n")
print(all_objects)

# Look for coefficient data objects
coef_objects <- grep("_10yr|_30yr|coef|beta|base|full|uacr|hba1c|sdi", all_objects, value = TRUE)
cat("\nPotential coefficient objects:\n")
print(coef_objects)

# Extract all coefficient tables
coefficients <- list()

for (obj_name in coef_objects) {
  tryCatch({
    obj <- get(obj_name, envir = pkg_env)
    coefficients[[obj_name]] <- obj
    cat(sprintf("\nSuccessfully extracted: %s\n", obj_name))
    cat(sprintf("  Type: %s\n", class(obj)))
    if (is.data.frame(obj)) {
      cat(sprintf("  Dimensions: %d rows x %d cols\n", nrow(obj), ncol(obj)))
      cat(sprintf("  Column names: %s\n", paste(names(obj), collapse = ", ")))
    }
  }, error = function(e) {
    cat(sprintf("Could not extract %s: %s\n", obj_name, e$message))
  })
}

# Save coefficients as JSON
output_file <- "prevent_coefficients.json"
cat(sprintf("\nWriting coefficients to %s...\n", output_file))

jsonlite::write_json(
  coefficients,
  output_file,
  pretty = TRUE,
  auto_unbox = TRUE,
  digits = 10
)

cat(sprintf("Successfully saved %d coefficient tables to %s\n", length(coefficients), output_file))
cat("\nExtraction complete!\n")

# Also create a summary file
summary_info <- list(
  extraction_date = Sys.time(),
  preventr_version = packageVersion("preventr"),
  r_version = R.version.string,
  coefficient_tables = names(coefficients),
  table_info = lapply(coefficients, function(x) {
    if (is.data.frame(x)) {
      list(
        type = "data.frame",
        rows = nrow(x),
        cols = ncol(x),
        columns = names(x)
      )
    } else {
      list(
        type = class(x),
        structure = str(x, max.level = 1)
      )
    }
  })
)

jsonlite::write_json(
  summary_info,
  "prevent_extraction_summary.json",
  pretty = TRUE,
  auto_unbox = TRUE
)

cat("\nCreated summary file: prevent_extraction_summary.json\n")
