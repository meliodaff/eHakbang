"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "./types";

/**
 * Lightweight i18n for eHakbang (PRD FR-11).
 *
 * A global language preference (Filipino / English) persisted to localStorage.
 * Content is authored in English (the source language); `t()` returns the
 * Filipino translation when available and falls back to the English source
 * otherwise, so partial dictionaries degrade gracefully rather than breaking.
 */

const STORAGE_KEY = "ehakbang:lang";
const CHANGE_EVENT = "ehakbang:lang-changed";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  // Hydrate the saved preference and keep multiple toggles/tabs in sync.
  useEffect(() => {
    const read = () => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "fil" || saved === "en") setLangState(saved);
      } catch {
        /* storage unavailable — default language is fine */
      }
    };
    read();
    window.addEventListener(CHANGE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(CHANGE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      /* storage unavailable — session-only is acceptable */
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Translate a source (English) string for the given language. */
export function translate(text: string, lang: Language): string {
  if (lang === "fil") return FIL[text] ?? text;
  return text;
}

/** Hook returning a localizer bound to the current language. */
export function useT(): (text: string) => string {
  const { lang } = useLanguage();
  return useCallback((text: string) => translate(text, lang), [lang]);
}

/**
 * English → Filipino dictionary. Keys are the exact English source strings.
 * Agency names, document names, and official service names are intentionally
 * left untranslated (proper/technical nouns commonly used as-is in PH).
 */
const FIL: Record<string, string> = {
  // ── UI chrome ─────────────────────────────────────────────
  of: "sa",
  "Documents needed": "Mga kailangang dokumento",
  "Estimated time:": "Tinatayang oras:",
  "Go to Official Service": "Pumunta sa Opisyal na Serbisyo",
  "Mark as Done": "Markahang Tapos",
  "Did you complete this step?": "Natapos mo na ba ang hakbang na ito?",
  Yes: "Oo",
  "Not Yet": "Hindi Pa",
  Completed: "Tapos na",
  "You already have this — it's in your ID Wallet":
    "Meron ka na nito — nasa iyong ID Wallet",
  "Record Update": "Pag-update ng Rekord",
  "Record Updates": "Mga Pag-update ng Rekord",
  "Benefit Claim": "Pag-claim ng Benepisyo",
  "Benefit Claims": "Mga Pag-claim ng Benepisyo",
  "steps complete": "hakbang tapos",
  "Ask about this step": "Magtanong tungkol sa hakbang na ito",
  Send: "Ipadala",
  "Your question about": "Ang iyong tanong tungkol sa",
  "e.g. Kailangan ko ba ng appointment bago pumunta?":
    "hal. Kailangan ko ba ng appointment bago pumunta?",
  "Answers from eHakbang AI will appear here once connected. For now, please refer to the official service page above.":
    "Lalabas dito ang mga sagot mula sa eHakbang AI kapag naka-connect na. Sa ngayon, sumangguni sa opisyal na service page sa itaas.",
  "Benefit details and eligibility may change. Always verify current amounts and requirements on the official agency page before proceeding.":
    "Maaaring magbago ang detalye at pagiging kwalipikado sa benepisyo. Palaging tiyakin ang kasalukuyang halaga at requirements sa opisyal na agency page bago magpatuloy.",

  // ── Journey screen chrome ─────────────────────────────────
  "All steps complete! 🎉": "Kumpleto na ang lahat ng hakbang! 🎉",
  "Finish journey": "Tapusin ang journey",
  "auto-completed from your": "awtomatikong nakumpleto mula sa iyong",
  "ID Wallet": "ID Wallet",
  "Loading…": "Naglo-load…",
  "No active journey": "Walang aktibong journey",
  "Choose a life event to start.": "Pumili ng life event para magsimula.",

  // ── Apply All ─────────────────────────────────────────────
  "Quick apply": "Mabilisang pag-apply",
  "Do you want to apply to all": "Gusto mo bang i-apply ang lahat ng",
  "processes at once, or one by one?": "proseso nang sabay-sabay, o isa-isa?",
  "Apply All": "I-apply Lahat",
  "No, one by one": "Hindi, isa-isa",
  "Submitting your applications…": "Sinusumite ang iyong mga aplikasyon…",
  "Submitted to each agency in sequence.":
    "Isinusumite sa bawat ahensya nang sunod-sunod.",
  "All done applying! 🎉": "Tapos na ang pag-apply! 🎉",
  "Submitted to all": "Naisumite sa lahat ng",
  "agencies.": "ahensya.",
  Continue: "Ipagpatuloy",
  Submitted: "Naisumite",
  "Submitting…": "Sinusumite…",
  Waiting: "Naghihintay",

  // ── Verification screens ──────────────────────────────────
  "Verify your graduation": "I-verify ang iyong graduation",
  "Upload a document proving you graduated (e.g. diploma or transcript) before continuing.":
    "Mag-upload ng dokumento na nagpapatunay na ikaw ay nakapagtapos (hal. diploma o transcript) bago magpatuloy.",
  "Verify your new residence": "I-verify ang iyong bagong tirahan",
  "Upload proof of your new address (e.g. billing statement or barangay certificate) before continuing.":
    "Mag-upload ng patunay ng bagong address (hal. billing statement o barangay certificate) bago magpatuloy.",
  "Verify your employment": "I-verify ang iyong trabaho",
  "Upload proof of employment (e.g. job offer or certificate of employment) before continuing.":
    "Mag-upload ng patunay ng trabaho (hal. job offer o certificate of employment) bago magpatuloy.",
  "Verify your disability": "I-verify ang iyong kapansanan",
  "Upload a document proving your disability (e.g. a medical certificate or PWD assessment) before continuing.":
    "Mag-upload ng dokumento na nagpapatunay ng iyong kapansanan (hal. medical certificate o PWD assessment) bago magpatuloy.",
  "Verify your document": "I-verify ang iyong dokumento",
  "Upload a supporting document before continuing.":
    "Mag-upload ng sumusuportang dokumento bago magpatuloy.",
  "JPG, PNG, or PDF": "JPG, PNG, o PDF",
  "Choose a document": "Pumili ng dokumento",
  "Change document": "Palitan ang dokumento",
  "Document accepted": "Na-accept ang dokumento",
  "Demo only: any document is auto-accepted. Nothing is saved or uploaded to a server.":
    "Demo lang: awtomatikong tinatanggap ang anumang dokumento. Walang na-i-save o na-i-upload sa server.",
  "Liveness check": "Liveness check",
  "Verify that you are the one performing this step.":
    "I-verify na ikaw mismo ang gumagawa ng hakbang na ito.",
  "Face the camera and press “Start”.":
    "Iharap ang mukha sa camera at pindutin ang “Simulan”.",
  "Scanning… please hold still.": "Sinusuri… huwag gumalaw.",
  "Identity verified": "Na-verify ang pagkakakilanlan",
  "Demo only: no camera or biometric is captured. This check passes automatically.":
    "Demo lang: walang camera o biometric na kinukuha. Awtomatikong pumapasa ang check na ito.",
  "Start liveness check": "Simulan ang liveness check",
  "Continue journey": "Ipagpatuloy ang journey",
  "Verification · Step 1 of 2": "Beripikasyon · Hakbang 1 ng 2",
  "Verification · Step 2 of 2": "Beripikasyon · Hakbang 2 ng 2",

  // ── Completion screen ─────────────────────────────────────
  "Journey Complete!": "Tapos na ang Journey!",
  "You've completed all the steps for":
    "Natapos mo na ang lahat ng hakbang para sa",
  "Life event": "Life event",
  "Steps completed": "Mga hakbang na natapos",
  "Completed on": "Natapos noong",
  "Archive This Journey": "I-archive ang Journey na Ito",
  "Start a New Journey": "Magsimula ng Bagong Journey",
  "Back to Home": "Bumalik sa Home",
  "Continue to Dashboard": "Magpatuloy sa Dashboard",

  // ── Life event titles ─────────────────────────────────────
  "Got Married": "Bagong Kasal",
  "Had a Baby": "Bagong Panganak",
  "Lost a Job": "Nawalan ng Trabaho",
  Retired: "Nagretiro",
  "Started a Business": "Nagnegosyo",
  "Became a Senior Citizen": "Naging Senior Citizen",
  "Became a PWD": "Naging PWD",
  "Death in the Family": "Pagpanaw sa Pamilya",
  "Just Graduated": "Bagong Graduate",
  "Started First Job": "Unang Trabaho",
  "Moved Residence": "Lumipat ng Tirahan",
  Annulment: "Anulment",

  // ── Journey summaries ─────────────────────────────────────
  "Update your civil status across all agencies so your spouse is recognized.":
    "I-update ang iyong civil status sa lahat ng ahensya para makilala ang iyong asawa.",
  "Register your newborn and claim the maternity and health benefits you're entitled to.":
    "Irehistro ang iyong bagong silang at i-claim ang maternity at health benefits na nararapat sa iyo.",
  "Claim the unemployment support you're entitled to and keep your memberships active.":
    "I-claim ang unemployment support na nararapat sa iyo at panatilihing aktibo ang iyong mga membership.",
  "Claim your pension and provident benefits and convert your memberships.":
    "I-claim ang iyong pension at provident benefits at i-convert ang iyong mga membership.",
  "Register your business with the right agencies so you can operate legally.":
    "Irehistro ang iyong negosyo sa tamang mga ahensya para makapag-operate nang legal.",
  "Claim your senior citizen ID and the benefits and pension you qualify for.":
    "Kunin ang iyong senior citizen ID at ang mga benepisyo at pension na kwalipikado ka.",
  "Register as a PWD to access your ID, coverage, and assistance.":
    "Magparehistro bilang PWD para ma-access ang iyong ID, coverage, at tulong.",
  "Process the death certificate and claim the survivor and funeral benefits due.":
    "Iproseso ang death certificate at i-claim ang survivor at funeral benefits na nararapat.",
  "Set up your government IDs and memberships as you prepare for your first job.":
    "Ihanda ang iyong mga government ID at membership habang naghahanda para sa iyong unang trabaho.",
  "Complete the government registrations your first employer will require.":
    "Kumpletuhin ang mga government registration na kakailanganin ng iyong unang employer.",
  "Update your address and voter registration to match your new home.":
    "I-update ang iyong address at voter registration para tumugma sa iyong bagong tahanan.",
  "Update your civil status back to single across all agencies now that your marriage has been annulled.":
    "I-update ang iyong civil status pabalik sa single sa lahat ng ahensya ngayong na-anul na ang iyong kasal.",

  // ── Estimated time ────────────────────────────────────────
  "Same day": "Sa loob ng araw",
  "Same day (online)": "Sa loob ng araw (online)",
  "1–2 days": "1–2 araw",
  "1–3 days": "1–3 araw",
  "3–7 days": "3–7 araw",
  "1–2 weeks": "1–2 linggo",
  "2–4 weeks": "2–4 linggo",
  "4–8 weeks": "4–8 linggo",
  "Same day–1 week": "Sa loob ng araw–1 linggo",
  "At discharge or within 60 days": "Sa discharge o sa loob ng 60 araw",
  "Subject to validation": "Depende sa validation",
  "Subject to registration schedule": "Depende sa iskedyul ng registration",
  "2–6 weeks": "2–6 linggo",

  // ── Step titles ───────────────────────────────────────────
  "Update civil status & beneficiaries":
    "I-update ang civil status at beneficiaries",
  "Add your spouse as dependent": "Idagdag ang asawa bilang dependent",
  "Update Pag-IBIG member information":
    "I-update ang impormasyon sa Pag-IBIG",
  "Update civil status (BIR Form 2305)":
    "I-update ang civil status (BIR Form 2305)",
  "Update your surname on your National ID":
    "I-update ang apelyido sa iyong National ID",
  "Register your baby's birth": "Irehistro ang kapanganakan ng iyong anak",
  "Claim maternity & newborn benefits":
    "I-claim ang maternity at newborn benefits",
  "Claim your SSS maternity benefit": "I-claim ang iyong SSS maternity benefit",
  "Add your newborn as dependent": "Idagdag ang bagong silang bilang dependent",
  "Update your Pag-IBIG beneficiaries":
    "I-update ang iyong mga Pag-IBIG beneficiary",
  "Claim SSS Unemployment Benefit": "I-claim ang SSS Unemployment Benefit",
  "Register for job matching / livelihood":
    "Magparehistro para sa job matching / livelihood",
  "Shift to Direct Contributor": "Lumipat sa Direct Contributor",
  "Continue as Voluntary Member": "Magpatuloy bilang Voluntary Member",
  "File your retirement pension": "I-file ang iyong retirement pension",
  "Claim your Pag-IBIG provident benefit":
    "I-claim ang iyong Pag-IBIG provident benefit",
  "Convert to Lifetime Member": "Mag-convert sa Lifetime Member",
  "Update member records & beneficiaries":
    "I-update ang member records at beneficiaries",
  "Register your business name": "Irehistro ang pangalan ng iyong negosyo",
  "Register with the BIR": "Magparehistro sa BIR",
  "Get your Mayor's / Business Permit":
    "Kunin ang iyong Mayor's / Business Permit",
  "Register as an employer": "Magparehistro bilang employer",
  "Get your Senior Citizen ID & booklet":
    "Kunin ang iyong Senior Citizen ID at booklet",
  "Confirm senior citizen coverage": "Kumpirmahin ang senior citizen coverage",
  "Apply for Social Pension (if qualified)":
    "Mag-apply para sa Social Pension (kung kwalipikado)",
  "Claim your pension (if a member)":
    "I-claim ang iyong pension (kung miyembro)",
  "Register for your PWD ID": "Magparehistro para sa iyong PWD ID",
  "Confirm PhilHealth coverage as PWD":
    "Kumpirmahin ang PhilHealth coverage bilang PWD",
  "Access PWD assistance & discount booklet":
    "I-access ang PWD assistance at discount booklet",
  "Claim disability benefit (if a member)":
    "I-claim ang disability benefit (kung miyembro)",
  "Register the death certificate": "Irehistro ang death certificate",
  "Claim the funeral benefit": "I-claim ang funeral benefit",
  "File for survivorship pension": "Mag-file para sa survivorship pension",
  "Claim Pag-IBIG death/provident benefit":
    "I-claim ang Pag-IBIG death/provident benefit",
  "Get your TIN": "Kunin ang iyong TIN",
  "Register for your SSS number": "Magparehistro para sa iyong SSS number",
  "Register with PhilHealth & Pag-IBIG":
    "Magparehistro sa PhilHealth at Pag-IBIG",
  "Register for job matching": "Magparehistro para sa job matching",
  "Get / update your TIN": "Kunin / i-update ang iyong TIN",
  "Register your SSS number": "Irehistro ang iyong SSS number",
  "Register with PhilHealth": "Magparehistro sa PhilHealth",
  "Register with Pag-IBIG": "Magparehistro sa Pag-IBIG",
  "Transfer your voter registration": "Ilipat ang iyong voter registration",
  "Update your barangay residency": "I-update ang iyong barangay residency",
  "Update your address on file": "I-update ang iyong address na naka-file",
  "Update National ID & driver's license address":
    "I-update ang address sa National ID at driver's license",
  "Annotate your marriage certificate":
    "I-annotate ang iyong marriage certificate",
  "Remove your former spouse as dependent":
    "Alisin ang dating asawa bilang dependent",
  "Revert your surname on your National ID":
    "Ibalik ang apelyido sa iyong National ID",

  // ── Step reasons ──────────────────────────────────────────
  "Ensures your spouse is recognized as a beneficiary.":
    "Tinitiyak na kilalanin ang iyong asawa bilang beneficiary.",
  "A non-working spouse can share your PhilHealth coverage.":
    "Maaaring makibahagi sa iyong PhilHealth coverage ang asawang walang trabaho.",
  "Keep civil status and beneficiaries current.":
    "Panatilihing updated ang civil status at beneficiaries.",
  "Reflects your new civil status for correct withholding.":
    "Ipinapakita ang bagong civil status para sa tamang withholding.",
  "Keeps your National ID consistent if you're taking your spouse's surname.":
    "Pinapanatiling consistent ang National ID kung gagamitin mo ang apelyido ng asawa.",
  "An official birth certificate is needed for most other steps.":
    "Kailangan ang opisyal na birth certificate para sa karamihan ng ibang hakbang.",
  "Helps cover delivery and your newborn's initial care.":
    "Tumutulong sa gastos ng panganganak at unang pangangalaga sa sanggol.",
  "Contributing members may receive a cash maternity benefit.":
    "Maaaring makatanggap ng cash maternity benefit ang mga miyembrong nagkokontribusyon.",
  "Extends your PhilHealth coverage to your baby.":
    "Pinapalawak ang iyong PhilHealth coverage para sa iyong anak.",
  "Keeps your savings and benefits directed to your family.":
    "Tinitiyak na napupunta sa iyong pamilya ang savings at benepisyo.",
  "Involuntarily separated members may claim cash support.":
    "Maaaring mag-claim ng cash support ang mga involuntarily separated na miyembro.",
  "Access DOLE job matching and livelihood assistance.":
    "I-access ang DOLE job matching at livelihood assistance.",
  "Keeps your health coverage active after employment ends.":
    "Pinapanatiling aktibo ang health coverage matapos ang trabaho.",
  "Maintains your Pag-IBIG savings and loan eligibility.":
    "Pinapanatili ang Pag-IBIG savings at loan eligibility.",
  "Qualified retirees receive a monthly pension or lump sum.":
    "Ang kwalipikadong retirees ay tumatanggap ng buwanang pension o lump sum.",
  "Retirement is a valid ground to claim your total savings.":
    "Ang pagreretiro ay balidong dahilan para i-claim ang buong savings mo.",
  "Retirees with enough contributions get free lifetime coverage.":
    "Ang retirees na may sapat na kontribusyon ay may libreng lifetime coverage.",
  "Ensure pension and survivorship details are correct.":
    "Tiyaking tama ang detalye ng pension at survivorship.",
  "Sole proprietors must register their business name (SEC for corporations).":
    "Dapat irehistro ng sole proprietor ang business name (SEC para sa korporasyon).",
  "Get your Certificate of Registration and official receipts.":
    "Kunin ang iyong Certificate of Registration at official receipts.",
  "Required to legally operate within the locality.":
    "Kailangan para makapag-operate nang legal sa lokalidad.",
  "Required once you hire employees.":
    "Kailangan kapag may kinuha ka nang empleyado.",
  "Unlocks legally mandated senior discounts and privileges.":
    "Binubuksan ang mga senior discount at pribilehiyong itinatakda ng batas.",
  "Senior citizens are automatically covered under the law.":
    "Awtomatikong saklaw ng batas ang mga senior citizen.",
  "Indigent seniors receive a monthly social pension.":
    "Ang mahihirap na senior ay tumatanggap ng buwanang social pension.",
  "Members aged 60+ may start their retirement pension.":
    "Ang mga miyembrong 60+ ay maaaring simulan ang retirement pension.",
  "Unlocks legally mandated PWD discounts and privileges.":
    "Binubuksan ang mga PWD discount at pribilehiyong itinatakda ng batas.",
  "PWDs are covered under national health insurance.":
    "Saklaw ng national health insurance ang mga PWD.",
  "Provides purchase booklets and possible assistance programs.":
    "Nagbibigay ng purchase booklet at posibleng assistance programs.",
  "Members with disability may qualify for a benefit.":
    "Ang mga miyembrong may kapansanan ay maaaring maging kwalipikado sa benepisyo.",
  "Required before most benefits can be claimed.":
    "Kailangan bago ma-claim ang karamihan ng benepisyo.",
  "A funeral grant is provided to whoever paid for the burial.":
    "Ang funeral grant ay ibinibigay sa nagbayad ng libing.",
  "Qualified beneficiaries may receive a monthly pension.":
    "Ang kwalipikadong beneficiaries ay maaaring makatanggap ng buwanang pension.",
  "Beneficiaries may claim the member's provident savings.":
    "Maaaring i-claim ng beneficiaries ang provident savings ng miyembro.",
  "A Tax Identification Number is required for employment.":
    "Kailangan ang Tax Identification Number para sa trabaho.",
  "Your SSS number follows you across every employer.":
    "Ang iyong SSS number ay dala-dala sa bawat employer.",
  "Basic memberships you'll need once employed.":
    "Mga batayang membership na kakailanganin mo kapag may trabaho na.",
  "Access job listings and DOLE programs for new graduates.":
    "I-access ang job listings at DOLE programs para sa mga bagong graduate.",
  "Required for tax withholding by your employer.":
    "Kailangan para sa tax withholding ng iyong employer.",
  "Enables your contributions and future benefits.":
    "Nagbibigay-daan sa iyong kontribusyon at benepisyo sa hinaharap.",
  "Provides your national health insurance coverage.":
    "Nagbibigay ng iyong national health insurance coverage.",
  "Enables savings and future housing loan eligibility.":
    "Nagbibigay-daan sa savings at housing loan eligibility sa hinaharap.",
  "Lets you vote in your new city/municipality.":
    "Nagbibigay-daan para makaboto sa iyong bagong lungsod/munisipalidad.",
  "Establishes residency for local services and clearances.":
    "Nagtatatag ng residency para sa lokal na serbisyo at clearance.",
  "Keeps your contribution records and mail accurate.":
    "Pinapanatiling tama ang contribution records at koreo.",
  "Keeps your primary IDs consistent with your residence.":
    "Pinapanatiling consistent ang mga pangunahing ID sa iyong tirahan.",
  "The court decree must be annotated on your PSA marriage record before other agencies will recognize it.":
    "Dapat i-annotate ang court decree sa iyong PSA marriage record bago ito kilalanin ng ibang ahensya.",
  "Reverts your recognized civil status and beneficiary records to single.":
    "Ibinabalik ang iyong nakilalang civil status at beneficiary records sa single.",
  "Keeps your PhilHealth dependents accurate after the annulment.":
    "Pinapanatiling tama ang iyong PhilHealth dependents matapos ang anulment.",
  "Keeps your National ID consistent if you're reverting to your maiden/former surname.":
    "Pinapanatiling consistent ang National ID kung babalik ka sa iyong dating apelyido.",

  // ── Important notes ───────────────────────────────────────
  "A non-working spouse can be a free dependent.":
    "Ang asawang walang trabaho ay maaaring maging libreng dependent.",
  "Optional under Philippine law — only needed if you're changing your surname.":
    "Opsyonal sa ilalim ng batas ng Pilipinas — kailangan lang kung papalitan mo ang iyong apelyido.",
  "Register within 30 days to avoid late registration.":
    "Magparehistro sa loob ng 30 araw para maiwasan ang late registration.",
  "Verify current coverage amounts on the official page.":
    "Tiyakin ang kasalukuyang coverage amounts sa opisyal na page.",
  "Amount depends on contributions — verify officially.":
    "Nakadepende ang halaga sa kontribusyon — tiyakin nang opisyal.",
  "File within one year of separation.":
    "Mag-file sa loob ng isang taon mula sa separation.",
  "Programs vary — check current availability.":
    "Nag-iiba ang mga programa — tingnan ang kasalukuyang availability.",
  "Amount depends on contributions/service — verify officially.":
    "Nakadepende ang halaga sa kontribusyon/serbisyo — tiyakin nang opisyal.",
  "Eligibility is means-tested — verify with your LGU/DSWD.":
    "Means-tested ang eligibility — tiyakin sa iyong LGU/DSWD.",
  "Verify amount and eligibility officially.":
    "Tiyakin ang halaga at eligibility nang opisyal.",
  "Programs vary by LGU — verify locally.":
    "Nag-iiba ang mga programa bawat LGU — tiyakin nang lokal.",
  "Verify eligibility and amount officially.":
    "Tiyakin ang eligibility at halaga nang opisyal.",
  "Register promptly to avoid late-registration steps.":
    "Magparehistro agad para maiwasan ang mga hakbang sa late registration.",
  "Verify the current grant amount officially.":
    "Tiyakin ang kasalukuyang grant amount nang opisyal.",
  "Eligibility depends on the member's record.":
    "Nakadepende ang eligibility sa rekord ng miyembro.",
  "Only during COMELEC registration periods.":
    "Sa panahon lamang ng COMELEC registration.",
  "Optional under Philippine law — only needed if you're changing your surname back.":
    "Opsyonal sa ilalim ng batas ng Pilipinas — kailangan lang kung babalik ka sa iyong dating apelyido.",
};
