#!/bin/bash
## Install dependencies
pyenv update
pyenv install 3.12 -s
pyenv shell 3.12
pip install -U llm-file-combiner

## Configure input and output folders
data_folder="data"
public_folder="public"
input_folders=(
    "frontend"
    "backend"
    "docs"
)
docs_folders=(
    "docs"
)
app_folders=(
    "frontend"
    "backend"
    "scripts"
)

## Configure ignore mask and extensions
ignore_mask=(
    .env
    node_modules
    __pycache__
    .pyc
    build
    dist
    data
    .gitignore
    .git
    .obsidian
    .venv
    .vscode
    .idea
    .DS_Store
    .png
    .ico
    .jpg
    .jpeg
    .gif
    .bmp
    .svg
    .tiff
    .webp
    .txt
    codebase.md
    .json
    .xml
    .cursorrules
    .cursorignore
)
extensions=(
    Dockerfile
    docker-compose.yml
    .py
    .txt
    .test.ts
    .test.tsx
    .md
    .html
    .css
    .ts
    .tsx
    .js
    .jsx
    robots.txt
    package.json
    tsconfig.json
    manifest.json
    sitemap.xml
    .conf
    CMakeLists.txt
    .cpp
    .c
    .hpp
    .h
    .cs
    .sh
    CNAME
    .env-example
    .env.example
    .env.example-old
    PROJECT.md
    README.md
    CONTRIBUTING.md
    SECURITY.md
)

## Declare Functions
# remove generated files
function clean_build(){
    echo "Nothing to do"
    #rm -rf "$public_folder/static"
    #for folder in `find src/services -type d | grep shared`; do rm $folder/kafka_models.py; done
    #for folder in `find src/scripts -type d | grep shared`; do rm $folder/kafka_models.py; done
}

# main combiner function
function combine_files() {
    input_folder=$1
    output_file=$2
    file-combiner "$input_folder" --output "$output_file" --extensions "${extensions[@]}" --ignore "${ignore_mask[@]}"
}

# generate output filename
function generate_output_filename() {
    local input_path=$1
    local output_filename
    # Remove 'src/' prefix if present
    output_filename=${input_path#src/}
    # Replace '/' with '_' in the filename
    output_filename=${output_filename//\//_}
    echo "${output_filename}_combined.xml"
}


## Run Combiner
echo "clean-up previous builds"
clean_build
mkdir -p "${data_folder}/apps"
mkdir -p "${data_folder}/docs"

# Run combiner for each input folder
for input_folder in "${input_folders[@]}"; do
    echo "Combining files in $input_folder"
    output_file=$(generate_output_filename "$input_folder")
    combine_files "$input_folder" "${data_folder}/${output_file}"
done

# Run combiner for each component
#for folder in `find src/services -type d | grep shared`; do cp src/shared/kafka_models.py $folder/kafka_models.py; done
#for folder in `find src/scripts -type d | grep shared`; do cp src/shared/kafka_models.py $folder/kafka_models.py; done

for app_folder in "${app_folders[@]}"; do
    echo "Combining files in $app_folder"
    output_file=$(generate_output_filename "$app_folder")
    combine_files "$app_folder" "${data_folder}/apps/${output_file}"
done

for docs_folder in "${docs_folders[@]}"; do
    echo "Combining files in $docs_folder"
    output_file=$(generate_output_filename "$docs_folder")
    combine_files "$docs_folder" "${data_folder}/docs/${output_file}"
done
clean_build

# run combiner for the root folder
echo "Combining all files in current directory"
combine_files "." "${data_folder}/app_repo_summary.xml"

# when working on a specific part of the codebase, use the following commands to update the llm file
# cp "${data_folder}/app_repo_summary.xml" "${data_folder}/app_repo_summary-too-big.xml"
# cp "${data_folder}/services_combined.xml" "${data_folder}/app_repo_summary.xml"
