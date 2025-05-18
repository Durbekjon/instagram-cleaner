const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitAndClick(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    const element = await page.$(selector);
    if (element) {
      await element.click();
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

// Helper function to find elements by XPath
async function findByXPath(page, xpath) {
  const elements = await page.evaluate((xpath) => {
    const results = [];
    const query = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < query.snapshotLength; i++) {
      results.push(query.snapshotItem(i));
    }
    return results;
  }, xpath);
  
  return elements;
}

async function enterSelectionMode(page) {
  const selectButtonFound = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('[role="button"]'));
    const selectButton = buttons.find(button => button.textContent.includes('Select'));
    if (selectButton) {
      selectButton.click();
      return true;
    }
    return false;
  });

  if (selectButtonFound) {
    console.log('✅ Entered selection mode.');
    await sleep(2000);
    return true;
  } else {
    console.log('❌ Could not find the "Select" button.');
    return false;
  }
}

async function deleteMyComments(page, limit = 10) {
  const activityUrl = 'https://www.instagram.com/your_activity/interactions/comments/';
  let deleted = 0;
  const MAX_BATCH_SIZE = 5; // Maximum comments to process at a time

  try {
    console.log('🧭 Navigating to Your Activity > Comments...');
    await page.goto(activityUrl, { waitUntil: 'networkidle2' });
    await sleep(3000); // Let the page hydrate

    // Initial entry into selection mode
    if (!await enterSelectionMode(page)) {
      return;
    }

    while (deleted < limit) {
      // Find checkboxes
      const checkboxes = await page.$$('[data-testid="bulk_action_checkbox"] [role="button"]');
      if (checkboxes.length === 0) {
        console.log('✨ No more comments to delete.');
        break;
      }

      // Delete all available comments if less than MAX_BATCH_SIZE
      // Otherwise, delete MAX_BATCH_SIZE comments
      let toDelete = Math.min(
        checkboxes.length,    // Available comments
        limit - deleted,      // Remaining comments to reach limit
        checkboxes.length <= MAX_BATCH_SIZE ? checkboxes.length : MAX_BATCH_SIZE // If less than max batch size, delete all
      );

      console.log(`🔍 Selecting ${toDelete} comment${toDelete > 1 ? 's' : ''}...`);

      // Click checkboxes
      for (let i = 0; i < toDelete; i++) {
        await checkboxes[i].click();
        await sleep(500);
      }

      // Wait a bit for the UI to update
      await sleep(1000);

      // Click the red Delete button with exact matching
      console.log('🔍 Looking for Delete button...');
      const deleteButtonClicked = await page.evaluate(() => {
        // Find the delete button with the exact structure
        const deleteButton = document.querySelector('[role="button"][aria-label="Delete"] span[style*="color: rgb(237, 73, 86)"]');
        if (deleteButton) {
          // Click the parent button element
          const buttonElement = deleteButton.closest('[role="button"]');
          if (buttonElement) {
            buttonElement.click();
            return true;
          }
        }
        return false;
      });

      if (deleteButtonClicked) {
        console.log('🗑️ Clicked Delete button');
        await sleep(1000);

        // Click the confirmation Delete button in the modal
        const confirmButtonClicked = await page.evaluate(() => {
          const modal = document.querySelector('._a9-v');
          if (modal) {
            const buttons = modal.querySelectorAll('button._a9--');
            for (const button of buttons) {
              const div = button.querySelector('div');
              if (div && div.textContent === 'Delete') {
                button.click();
                return true;
              }
            }
          }
          return false;
        });

        if (confirmButtonClicked) {
          console.log(`✅ Deleted ${toDelete} comment${toDelete > 1 ? 's' : ''}`);
          deleted += toDelete;
          
          // Wait longer after successful deletion
          console.log('⏳ Waiting for deletion to complete...');
          await sleep(15000);

          // Re-enter selection mode for the next batch
          console.log('🔄 Re-entering selection mode for next batch...');
          if (!await enterSelectionMode(page)) {
            console.log('❌ Could not re-enter selection mode. Stopping.');
            break;
          }
        } else {
          console.log('⚠️ Could not confirm deletion in modal');
        }
      } else {
        console.log('⚠️ Could not find or click red Delete button');
        // Log available buttons for debugging
        await page.evaluate(() => {
          console.log('Available buttons:');
          document.querySelectorAll('[role="button"]').forEach(button => {
            console.log('Button:', button.textContent, 'aria-label:', button.getAttribute('aria-label'));
          });
        });
      }

      // Wait between batches
      if (deleted < limit) {
        console.log(`😴 Waiting before next batch... (${deleted}/${limit} deleted)`);
        await sleep(2000);
      }
    }

    console.log(`🎉 Finished. Deleted ${deleted} comment${deleted !== 1 ? 's' : ''}.`);
    
  } catch (error) {
    console.error('❌ An error occurred:', error);
  }
}

module.exports = { deleteMyComments };
