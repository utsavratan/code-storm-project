import SEO from "@/components/seo/SEO";
import DocsShell, { CodeBlock, DocGroup, DocTable, Note, P, UL } from "@/components/docs/DocsShell";
import { resetConsent } from "@/components/CookieConsent";

const groups: DocGroup[] = [
  { label: "Overview", items: [
    { id: "summary", title: "Summary", content: (<>
      <P>Last updated: 29 September 2026. This policy explains how THRYLOS INDIA (New Delhi, India) uses cookies and similar browser storage on thrylosindia.in.</P>
      <Note title="In short">We only use storage that is needed to run the site. Anything optional stays off until you say yes.</Note>
    </>) },
    { id: "what-are-cookies", title: "What are cookies?", content: (
      <P>Cookies and local storage are small pieces of data saved by your browser. They let a site remember that you are signed in, your language, or your choices.</P>
    ) },
  ]},
  { label: "Categories", items: [
    { id: "necessary", title: "Strictly necessary", content: (<>
      <P>Always on. The site cannot work without these.</P>
      <DocTable head={["Name", "Purpose", "Duration"]} rows={[
        ["sb-*-auth-token", "Keeps you signed in securely", "Session / until sign-out"],
        ["thrylos_cookie_consent", "Remembers your cookie choice", "12 months"],
        ["language", "Remembers your selected language", "Persistent"],
        ["coord_mfa_token", "Coordinator authenticator session (staff only)", "12 hours"],
        ["blog drafts", "Autosaves unpublished posts (authors only)", "Until published"],
      ]} />
    </>) },
    { id: "analytics", title: "Analytics (optional)", content: (
      <P>Off by default. If enabled in the future, we would only measure anonymous page usage to improve the site. Nothing loads unless you accept analytics.</P>
    ) },
    { id: "third-party", title: "Third-party content", content: (<>
      <P>Some services we rely on set their own storage only when you use them:</P>
      <UL items={["Google sign-in — only when you choose Continue with Google.", "Cashfree Payments — only on the payment screen.", "Embedded media — only after you consent to optional content."]} />
    </>) },
  ]},
  { label: "Your choices", items: [
    { id: "manage", title: "Manage your consent", content: (<>
      <P>You can accept, reject or customise optional cookies in the banner. Change your choice at any time:</P>
      <button type="button" onClick={resetConsent} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Change cookie preferences
      </button>
      <P>You can also clear site data in your browser settings.</P>
    </>) },
    { id: "legal", title: "Legal basis", content: (
      <P>We process data in line with the Digital Personal Data Protection Act, 2023 (India). Necessary storage is used to provide the service you request; optional storage relies on your consent, which you can withdraw as easily as you gave it.</P>
    ) },
    { id: "contact", title: "Contact", content: (
      <CodeBlock label="grievance officer" code={`THRYLOS INDIA, New Delhi, India
Grievance Officer: Utsav Ratan
founder@thrylosindia.in · support@thrylosindia.in`} />
    ) },
  ]},
];

const CookiePolicy = () => (
  <>
    <SEO title="Cookie Policy | THRYLOS INDIA" description="How THRYLOS INDIA uses cookies and browser storage, and how to manage your consent under India's DPDP Act." path="/cookie-policy" />
    <DocsShell title="Cookie Policy" subtitle="What we store in your browser, why, and how you stay in control." badge="Legal" groups={groups} />
  </>
);

export default CookiePolicy;
