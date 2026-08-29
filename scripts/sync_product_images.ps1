# Complete Image Linking Script with Long Path & Correct Variable Names

$imageRoot = "c:\Users\Facundo Gomez\Documents\antigravity\adventurous-einstein\Vestix\Imagenes de productos-20260714T215518Z-1-001\Imagenes de productos"
$destLocal = "c:\Users\Facundo Gomez\Documents\antigravity\adventurous-einstein\Vestix\backend\uploads\products"
$podman = "C:\Users\Facundo Gomez\AppData\Local\Programs\Podman\podman.exe"

if (-not (Test-Path -LiteralPath $destLocal)) {
    [System.IO.Directory]::CreateDirectory($destLocal) | Out-Null
}

function Normalize-Text([string]$text) {
    if ([string]::IsNullOrWhiteSpace($text)) { return "" }
    $text = [System.Text.RegularExpressions.Regex]::Replace($text, "(?i)\bArt\.?\s*\d+\b", "")
    $normalized = $text.Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $normalized.Length; $i++) {
        $c = $normalized[$i]
        $cat = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($c)
        if ($cat -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($c)
        }
    }
    $clean = $sb.ToString().ToLowerInvariant()
    $clean = [System.Text.RegularExpressions.Regex]::Replace($clean, "[^a-z0-9]", "")
    return $clean
}

# 1. Gather all folder leaf nodes
$allLeaves = @()

foreach ($bDir in [System.IO.Directory]::GetDirectories($imageRoot)) {
    $bName = [System.IO.Path]::GetFileName($bDir)
    if ($bName -eq "LSK") {
        foreach ($subDir in [System.IO.Directory]::GetDirectories($bDir)) {
            $subName = [System.IO.Path]::GetFileName($subDir)
            $brandTag = if ($subName -eq "Man") { "LSKMAN" } else { "LSK" }
            foreach ($pDir in [System.IO.Directory]::GetDirectories($subDir)) {
                $allLeaves += [PSCustomObject]@{
                    Brand = $brandTag
                    NormalizedBrand = Normalize-Text $brandTag
                    Name = [System.IO.Path]::GetFileName($pDir)
                    NormalizedName = Normalize-Text ([System.IO.Path]::GetFileName($pDir))
                    Path = $pDir
                }
            }
        }
    } else {
        $brandTag = if ($bName -eq "Pupe" -or $bName -eq "Pupé") { "Pupé" } else { $bName }
        foreach ($pDir in [System.IO.Directory]::GetDirectories($bDir)) {
            $allLeaves += [PSCustomObject]@{
                Brand = $brandTag
                NormalizedBrand = Normalize-Text $brandTag
                Name = [System.IO.Path]::GetFileName($pDir)
                NormalizedName = Normalize-Text ([System.IO.Path]::GetFileName($pDir))
                Path = $pDir
            }
        }
    }
}

Write-Host "Found $($allLeaves.Count) image product folders."

# 2. Get all DB Products fresh from DB
$sqlDump = @"
SELECT json_agg(p) FROM (
    SELECT 
        p.id,
        p.name,
        p."baseSku",
        b.name as brand_name,
        (SELECT count(*) FROM catalog."ProductVariant" v WHERE v."productId" = p.id) as variant_count
    FROM catalog."Product" p
    LEFT JOIN catalog."Brand" b ON b.id = p."brandId"
) p;
"@

$dbJson = $sqlDump | & $podman exec -i vestix-postgres-1 psql -U erp_admin -d erp_prod -t -A
$dbProducts = $dbJson | ConvertFrom-Json

Write-Host "Loaded $($dbProducts.Count) products from database."

$sqlStatements = [System.Collections.Generic.List[string]]::new()

# Always ensure SKU 0220 is set to Meferti
$sqlStatements.Add("UPDATE catalog.`"Product`" SET `"brandId`" = 'c08fba83-a24b-4c66-bb8b-c3619eaacfe6', `"categoryId`" = 'd2cff277-5376-4839-840b-5583178614fb' WHERE `"baseSku`" = '0220' AND (`"brandId`" IS NULL OR `"categoryId`" = 'd96e4aef-19f8-4532-bdcc-e9fab69875ff');")

$matchedProducts = 0
$copiedFiles = 0

foreach ($prod in $dbProducts) {
    $productId = $prod.id
    $prodName = $prod.name
    $prodSku = $prod.baseSku
    $prodBrand = $prod.brand_name
    if ($prodSku -eq "0220") { $prodBrand = "Meferti" }

    $pNormName = Normalize-Text $prodName
    $pNormBrand = Normalize-Text $prodBrand

    $matchedFolders = @()

    # Special rules
    if ($prodBrand -eq "Samara" -and $prodName -like "*Allende*") {
        $matchedFolders = $allLeaves | Where-Object { $_.Brand -eq "Samara" -and $_.Name -like "*Allende*" }
    } elseif ($prodBrand -eq "Samara" -and $prodName -like "*Cancun*") {
        $matchedFolders = $allLeaves | Where-Object { $_.Brand -eq "Samara" -and ($_.Name -like "*cancun*" -or $_.Name -like "*Cancun*") }
    } elseif ($prodBrand -eq "LSKMAN" -and $prodName -like "*Harry*") {
        $matchedFolders = $allLeaves | Where-Object { $_.Brand -eq "LSKMAN" -and $_.Name -like "*Harry*" }
    } else {
        # General matching
        $brandLeaves = $allLeaves | Where-Object { $_.NormalizedBrand -eq $pNormBrand }
        foreach ($leaf in $brandLeaves) {
            if ($leaf.NormalizedName -eq $pNormName) {
                $matchedFolders += $leaf
            } elseif ($leaf.NormalizedName.Length -ge 4 -and $pNormName.Length -ge 4) {
                if ($leaf.NormalizedName.Contains($pNormName) -or $pNormName.Contains($leaf.NormalizedName)) {
                    $matchedFolders += $leaf
                }
            }
        }
    }

    if ($matchedFolders.Count -gt 0) {
        $imgUrls = [System.Collections.Generic.List[string]]::new()
        $idx = 0
        $prefix = if ($prodSku) { $prodSku } else { $productId.Substring(0,8) }

        foreach ($mf in $matchedFolders) {
            $files = [System.IO.Directory]::GetFiles($mf.Path)
            [System.Array]::Sort($files)
            foreach ($srcPath in $files) {
                $ext = [System.IO.Path]::GetExtension($srcPath).ToLowerInvariant()
                if ([string]::IsNullOrEmpty($ext)) { $ext = ".webp" }
                $targetName = "${prefix}_${idx}${ext}"
                $targetPath = [System.IO.Path]::Combine($destLocal, $targetName)

                $longSrc = if ($srcPath.StartsWith("\\?\")) { $srcPath } else { "\\?\" + $srcPath }
                $longDest = if ($targetPath.StartsWith("\\?\")) { $targetPath } else { "\\?\" + $targetPath }

                try {
                    [System.IO.File]::Copy($longSrc, $longDest, $true)
                    $imgUrls.Add("/uploads/products/$targetName")
                    $copiedFiles++
                    $idx++
                } catch {
                    Write-Host "Warning copying $srcPath : $_"
                }
            }
        }

        if ($imgUrls.Count -gt 0) {
            $jsonArr = "[" + (($imgUrls | ForEach-Object { '"' + $_ + '"' }) -join ", ") + "]"
            $primaryUrl = $imgUrls[0]

            $sqlStatements.Add("UPDATE catalog.`"Product`" SET images = '$jsonArr'::jsonb WHERE id = '$productId';")
            $sqlStatements.Add("UPDATE catalog.`"ProductVariant`" SET `"imageUrl`" = '$primaryUrl' WHERE `"productId`" = '$productId';")
            $matchedProducts++
        }
    }
}

Write-Host "Total products matched and updated: $matchedProducts / $($dbProducts.Count)"
Write-Host "Total image files copied: $copiedFiles"

# Write SQL file
$sqlPath = "C:\Users\Facundo Gomez\.gemini\antigravity\brain\599637ed-305a-4629-a5f1-22c333ee5bbf\scratch\apply_all_images.sql"
[System.IO.File]::WriteAllText($sqlPath, ($sqlStatements -join "`n"), [System.Text.Encoding]::UTF8)

Write-Host "Executing SQL against PostgreSQL container..."
($sqlStatements -join "`n") | & $podman exec -i vestix-postgres-1 psql -U erp_admin -d erp_prod -q

Write-Host "Syncing files into container..."
& $podman cp "$destLocal/." vestix-backend-1:/app/uploads/products/

Write-Host "Verification Query:"
$verifySql = @"
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN jsonb_typeof(images) = 'array' AND jsonb_array_length(images) > 0 THEN 1 END) as products_with_images_array,
    COUNT(CASE WHEN images IS NULL OR images::text = '[]' OR jsonb_typeof(images) != 'array' THEN 1 END) as products_without_images
FROM catalog."Product";

SELECT 
    COUNT(*) as total_variants,
    COUNT(CASE WHEN "imageUrl" IS NOT NULL THEN 1 END) as variants_with_image,
    COUNT(CASE WHEN "imageUrl" IS NULL THEN 1 END) as variants_without_image
FROM catalog."ProductVariant";
"@

$verifySql | & $podman exec -i vestix-postgres-1 psql -U erp_admin -d erp_prod
