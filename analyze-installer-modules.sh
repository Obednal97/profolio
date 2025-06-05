#!/bin/bash

# =============================================================================
# INSTALLER MODULE ANALYSIS SCRIPT
# =============================================================================
# Analyzes all installer modules to find duplicate definitions and issues
# Compatible with macOS bash
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           📊 INSTALLER MODULE ANALYSIS                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [[ ! -d "install" ]]; then
    echo -e "${RED}[ERROR]${NC} Install directory not found. Run from project root."
    exit 1
fi

# =============================================================================
# 1. Find all color variable definitions
# =============================================================================
echo -e "${CYAN}=== COLOR VARIABLE DEFINITIONS ===${NC}"
echo ""

for color in RED GREEN YELLOW BLUE CYAN PURPLE WHITE NC; do
    echo -e "${BLUE}$color definitions:${NC}"
    grep -r "^\s*${color}=" install/ --include="*.sh" 2>/dev/null | while IFS= read -r line; do
        echo "  • $line"
    done
    grep -r "^\s*readonly ${color}=" install/ --include="*.sh" 2>/dev/null | while IFS= read -r line; do
        echo -e "  ${YELLOW}• [READONLY] $line${NC}"
    done
    echo ""
done

# =============================================================================
# 2. Find all logging function definitions
# =============================================================================
echo -e "${CYAN}=== LOGGING FUNCTION DEFINITIONS ===${NC}"
echo ""

for func in info warn error success log; do
    echo -e "${BLUE}$func() definitions:${NC}"
    grep -r "^${func}()" install/ --include="*.sh" 2>/dev/null | while IFS= read -r line; do
        echo "  • $line"
    done
    grep -r "^\s*${func}()" install/ --include="*.sh" 2>/dev/null | while IFS= read -r line; do
        echo "  • $line"
    done
    echo ""
done

# =============================================================================
# 3. Check specific files for issues
# =============================================================================
echo -e "${CYAN}=== SPECIFIC FILE ANALYSIS ===${NC}"
echo ""

# Check Ubuntu platform line 145
echo -e "${BLUE}Ubuntu platform line 145 context:${NC}"
if [[ -f "install/platforms/ubuntu.sh" ]]; then
    sed -n '140,150p' install/platforms/ubuntu.sh | nl -v 140
fi
echo ""

# Check LXC container wrapper
echo -e "${BLUE}LXC container wrapper analysis:${NC}"
if [[ -f "install/platforms/lxc-container.sh" ]]; then
    echo "Color definitions:"
    grep -E "RED=|GREEN=|YELLOW=|BLUE=|CYAN=|WHITE=|NC=" install/platforms/lxc-container.sh || echo "  None found"
    echo ""
    echo "Function definitions:"
    grep -E "^(info|warn|error|success)\(\)" install/platforms/lxc-container.sh || echo "  None found"
    echo ""
    echo "Exports:"
    grep "export" install/platforms/lxc-container.sh || echo "  None found"
fi
echo ""

# =============================================================================
# 4. Module dependency analysis
# =============================================================================
echo -e "${CYAN}=== MODULE DEPENDENCIES ===${NC}"
echo ""

echo -e "${BLUE}Files that source other files:${NC}"
grep -r "source\|^\." install/ --include="*.sh" 2>/dev/null | while IFS= read -r line; do
    echo "  • $line"
done
echo ""

# =============================================================================
# 5. Problematic patterns
# =============================================================================
echo -e "${CYAN}=== PROBLEMATIC PATTERNS ===${NC}"
echo ""

echo -e "${BLUE}Readonly declarations:${NC}"
readonly_count=$(grep -r "readonly" install/ --include="*.sh" 2>/dev/null | wc -l | tr -d ' ')
echo "  Total: $readonly_count occurrences"
grep -r "readonly" install/ --include="*.sh" 2>/dev/null | head -5
echo ""

echo -e "${BLUE}Conditional function definitions:${NC}"
conditional_count=$(grep -r "if.*command -v.*then" install/ --include="*.sh" 2>/dev/null | wc -l | tr -d ' ')
echo "  Total: $conditional_count occurrences"
grep -r "if.*command -v.*then" install/ --include="*.sh" -A 3 2>/dev/null | head -10
echo ""

echo -e "${BLUE}Local variables in global scope:${NC}"
grep -r "^\s*local " install/ --include="*.sh" 2>/dev/null | grep -v "function\|()" | head -5 || echo "  None found"
echo ""

# =============================================================================
# 6. Summary and recommendations
# =============================================================================
echo -e "${CYAN}=== SUMMARY ===${NC}"
echo ""

# Count duplicate definitions
echo -e "${BLUE}Duplicate definitions found:${NC}"
for item in "RED=" "GREEN=" "info()" "error()" "warn()" "success()"; do
    count=$(grep -r "$item" install/ --include="*.sh" 2>/dev/null | wc -l | tr -d ' ')
    if [[ $count -gt 1 ]]; then
        echo -e "  ${YELLOW}• $item appears in $count files${NC}"
    fi
done
echo ""

echo -e "${GREEN}=== RECOMMENDATIONS ===${NC}"
echo ""
echo "1. Create a centralized definitions file:"
echo "   • install/common/definitions.sh - Contains all colors and base functions"
echo ""
echo "2. Remove duplicate definitions from:"
echo "   • platforms/ubuntu.sh"
echo "   • platforms/lxc-container.sh"  
echo "   • utils/logging.sh"
echo ""
echo "3. Replace 'readonly' with regular variable assignments"
echo ""
echo "4. Ensure all modules source the common definitions first"
echo ""
echo "5. Use explicit exports when needed for sub-shells"
echo "" 