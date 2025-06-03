#!/bin/bash
# Release Date Verification Script
# Ensures chronological accuracy for Profolio releases

set -e

echo "🕐 Checking release date chronology..."

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)
echo "Current date: $CURRENT_DATE"

# Get last release date from CHANGELOG.md
LAST_DATE=$(grep -m1 "##.*v[0-9]" CHANGELOG.md | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' 2>/dev/null || echo "No previous releases")

if [ "$LAST_DATE" != "No previous releases" ]; then
    echo "Last release: $LAST_DATE"
    
    # Compare dates (string comparison works for ISO dates)
    if [[ "$CURRENT_DATE" > "$LAST_DATE" ]]; then
        echo "✅ Date chronology is correct"
    elif [[ "$CURRENT_DATE" == "$LAST_DATE" ]]; then
        echo "⚠️  WARNING: Same date as last release"
        echo "Multiple releases on same day are allowed but verify this is intentional"
    else
        echo "🚨 ERROR: Date chronology violation!"
        echo "Current date ($CURRENT_DATE) is not after last release ($LAST_DATE)"
        echo ""
        echo "Possible causes:"
        echo "- System clock is wrong"
        echo "- Timezone issue"
        echo "- Previous release has future date"
        echo "- Manual date entry error"
        echo ""
        echo "Solutions:"
        echo "1. Check system date: date"
        echo "2. Check timezone: date +%Z"
        echo "3. Sync system clock if needed"
        echo "4. Verify last release date in CHANGELOG.md"
        exit 1
    fi
else
    echo "ℹ️  No previous releases found - this appears to be the first release"
fi

# Export dates for use in other scripts
export RELEASE_DATE_ISO="$CURRENT_DATE"
export RELEASE_DATE_UK=$(date +%d-%m-%Y)
export RELEASE_DATE_READABLE=$(date +"%d %B %Y" | sed 's/^0//')

# Create ordinal date (1st, 2nd, 3rd, etc.)
DAY=$(date +%d | sed 's/^0//')
MONTH_YEAR=$(date +"%B %Y")

case $DAY in
    1|21|31) ORDINAL="${DAY}st" ;;
    2|22) ORDINAL="${DAY}nd" ;;
    3|23) ORDINAL="${DAY}rd" ;;
    *) ORDINAL="${DAY}th" ;;
esac

export RELEASE_DATE_ORDINAL="${ORDINAL} ${MONTH_YEAR}"

echo ""
echo "📅 Exported date variables:"
echo "RELEASE_DATE_ISO=$RELEASE_DATE_ISO"
echo "RELEASE_DATE_UK=$RELEASE_DATE_UK"  
echo "RELEASE_DATE_READABLE=$RELEASE_DATE_READABLE"
echo "RELEASE_DATE_ORDINAL=$RELEASE_DATE_ORDINAL"
echo ""
echo "📝 Ready for use in:"
echo "- CHANGELOG.md: ## [vX.Y.Z] - $RELEASE_DATE_ISO"
echo "- Release Notes: **Released**: $RELEASE_DATE_ORDINAL"
echo "- Documentation: Last Updated: $RELEASE_DATE_ORDINAL"

# Optional: Show recent release history for context
echo ""
echo "📊 Recent release history:"
grep -E "##.*v[0-9].*[0-9]{4}-[0-9]{2}-[0-9]{2}" CHANGELOG.md | head -3 2>/dev/null || echo "No release history found" 