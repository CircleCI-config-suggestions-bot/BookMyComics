import random

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

from . import SupportBase
from .. import RetriableError, retry, check_predicate

class IsekaiScanDriver(SupportBase):
    name = "isekaiscan"

    def __init__(self, *args, **kwargs):
        super(IsekaiScanDriver, self).__init__(*args, **kwargs)

    def home(self):
        # First, go to the website
        self._driver.get('https://isekaiscan.com/')
        # pass RPGD cookie consent button if any, since only necessary on the
        # first load during a testing session.
        rgpd_consent_btn = self._driver.find_elements(by=By.CSS_SELECTOR, value='.fc-cta-consent')
        if rgpd_consent_btn:
            rgpd_consent_btn[0].click()

    def _get_mangas(self):
        self.home()
        # Retrieve the generated random link, which is generated after loading the page
        return self._driver.find_elements(by=By.CSS_SELECTOR, value='.chapter-item')

    def _get_sep(self, url):
        return 'ch-' if '/ch-' in url else 'chapter-'

    @retry(abort=True)
    @check_predicate(RetriableError)
    def load_random(self):
        mangas = self._get_mangas()
        print(f'checking {len(mangas)} mangas...')
        candidates = []
        while len(mangas) > 0:
            manga = mangas.pop(random.randrange(len(mangas)))
            chapters = manga.find_elements(by=By.CSS_SELECTOR, value='.chapter>a')
            # Cannot check here that there's 3 chapters since they only display 2
            if len(chapters) < 2:
                continue
            candidates.append(chapters[1].get_attribute('href'))

        candidates = candidates[:5]
        print(f'checking {len(candidates)} candidates...')
        while len(candidates) > 0:
            candidate = candidates.pop(random.randrange(len(candidates)))
            print(f'checking {candidate} ...')
            # do not test cases where chapter numbering is "broken" and cannot
            # be unified (ex: `chapter-0-2`)
            sep = self._get_sep(candidate)
            if len(candidate.split('/')[-2].split(sep)[1].split('-')) > 1:
                print(f'Skip: sub-numbering -> {candidate}')
                continue
            self._driver.get(candidate)
            # pass RPGD cookie/tracking agreement button if any, since only
            # necessary on the first load during a testing session.
            cookie_ack_btn = self._driver.find_elements(by=By.CSS_SELECTOR, value='#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.sc-ifAKCX.ljEJIv')
            if cookie_ack_btn:
                cookie_ack_btn[0].click()

            # Success -> return
            if self.has_next_page() and self.has_prev_page():
                return

        raise RuntimeError("No manga with enough chapters nor with link on isekaiscan")

    def has_prev_page(self):
        if self._driver.find_elements(by=By.CSS_SELECTOR, value='.nav-previous > .prev_page'):
            return True
        return False

    def prev_page(self):
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.nav-previous > .prev_page')
        btn.click()

    def has_next_page(self):
        if self._driver.find_elements(by=By.CSS_SELECTOR, value='.nav-next > .next_page'):
            return True
        return False

    def next_page(self):
        btn = self._driver.find_element(by=By.CSS_SELECTOR, value='.nav-next > .next_page')
        btn.click()

    def get_comic_name(self):
        """
            Extracts the comic name from the current URL
        """
        url = self._driver.current_url
        if 'isekaiscan.com' not in url:
            return None
        parts = self._driver.find_elements(by=By.CSS_SELECTOR, value="#manga-reading-nav-head .breadcrumb li:nth-child(1) > a")
        return parts[0].text

    def get_chapter(self):
        sep = self._get_sep(self._driver.current_url)
        return self._driver.current_url.split('/')[-2].split(sep)[1]

    def get_page(self):
        return None
