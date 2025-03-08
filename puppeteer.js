import puppeteer from 'puppeteer-extra';
import fs from 'fs';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run(url, region) {
    console.log('start');
    const browser = await puppeteer.launch({ headless: true }); 
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    try {
        const currentRegion = await page.evaluate(() => {
            const regionElement = document.querySelector('.Region_region__6OUBn span');
            return regionElement ? regionElement.textContent.trim() : null;
        });
        if (currentRegion === region) {
            return
        } else {
            try {
                await page.waitForSelector('.UiHeaderHorizontalBase_region__2ODCG');
                console.log('задержка 4 секунды');
                await delay(4000); // Без задержки работает некорректно
                await page.click('.UiHeaderHorizontalBase_region__2ODCG');
                await page.waitForSelector('.UiRegionListBase_list__cH0fK li');
                await page.evaluate((region) => {
                    const elements = document.querySelectorAll('.UiRegionListBase_list__cH0fK li');
                    let element = null;
                    elements.forEach(el => {
                        if (el.textContent === region) {
                            element = el;
                        }
                    });
                    if (element) {
                        element.click();
                        return true;
                    }
                    return false;
                }, region);
                
            } catch (error) {
                ('Ошибка при выборе региона');
            }
        }
        await page.screenshot({ path: 'screenshot.jpg', fullPage: true });
        const productData = await page.evaluate(() => {
            const priceElement = document.querySelector('.Price_price__QzA8L.Price_size_XL__MHvC1.Price_role_discount__l_tpE').textContent;
            const priceOldElement = document.querySelector('.Price_price__QzA8L.Price_size_XS__ESEhJ.Price_role_old__r1uT1').textContent;
            const ratingElement = document.querySelector('.ActionsRow_stars__EKt42').textContent;
            const reviewCountElement = document.querySelector('.ActionsRow_reviews__AfSj_').textContent;

            const price = priceElement ? priceElement : null;
            const priceOld = priceOldElement ? priceOldElement : null;
            const rating = ratingElement ? ratingElement : null;
            const reviewCount = reviewCountElement ? reviewCountElement : null;

            return {
                price,
                priceOld,
                rating,
                reviewCount
            };
        });
        let data = `price=${productData.price}\n`;
        if (productData.priceOld) {
            data += `priceOld=${productData.priceOld}\n`;
        }
        data += `rating=${productData.rating}\n`;
        data += `reviewCount=${productData.reviewCount}\n`;

        fs.writeFileSync('product.txt', data);

    } catch (error) {
        console.error('Произошла ошибка:', error);
    } finally {
        await browser.close();
        console.log('stop');
    }
}

const [url, region] = process.argv.slice(2);
if (!url || !region) {
    ('Не указан <url> <region>');
    process.exit(1);

}

run(url, region);