import SEO from "@/components/seo/SEO";
import DocsShell, { CodeBlock, DocGroup, DocTable, H3, Note, P, UL } from "@/components/docs/DocsShell";
import { Link } from "react-router-dom";

const groups: DocGroup[] = [
  {
    label: "Getting Started",
    items: [
      {
        id: "introduction",
        title: "Introduction",
        keywords: "about overview introduction guide getting started thrylos india platform documentation",
        content: (
          <>
            <P>
              THRYLOS INDIA is a New Delhi based digital services studio. We design and build websites, web applications
              and mobile applications, and manage each project through a dedicated project manager and client dashboard.
            </P>

            <P>
              This documentation is designed to explain the complete THRYLOS INDIA experience in one place. Whether you
              are visiting the platform for the first time, starting a new project, reviewing an existing project,
              making a payment, verifying a document or managing your account, the sections below explain the relevant
              process in detail.
            </P>

            <P>
              The platform brings project communication, service requests, project progress, billing information and
              document verification together so that clients can follow important information without relying on
              scattered messages or separate records.
            </P>

            <H3>What this guide covers</H3>
            <UL
              items={[
                "Creating and accessing your THRYLOS INDIA account.",
                "Understanding your dashboard and project status.",
                "Starting a new service request.",
                "Preparing a clear and useful project brief.",
                "Selecting a project manager where the feature is available.",
                "Understanding milestones and project updates.",
                "Reviewing invoices and payment information.",
                "Understanding refunds and payment-related processes.",
                "Verifying invoices and other official documents.",
                "Checking employee ID cards and public verification records.",
                "Managing your profile and account information.",
                "Keeping your account secure.",
                "Understanding personal-data rights under India's DPDP framework.",
                "Finding support and resolving common issues.",
              ]}
            />

            <Note title="Who is this for?">
              Clients, employees and anyone who has received a THRYLOS INDIA document and wants to understand the
              platform or check whether a document is genuine.
            </Note>

            <H3>Where should I start?</H3>
            <P>
              If you are completely new to the platform, begin with{" "}
              <Link className="text-primary underline" to="/auth">
                Sign in
              </Link>
              . After creating or accessing your account, use{" "}
              <Link className="text-primary underline" to="/get-started">
                Get Started
              </Link>{" "}
              to submit a service request.
            </P>

            <P>
              If you have already received an invoice or official document, you can skip directly to the Payments or
              Documents & QR sections. If your question concerns your personal information, continue to the Account &
              Privacy section.
            </P>
          </>
        ),
      },

      {
        id: "create-account",
        title: "Create an account",
        keywords: "sign up register google otp email password account authentication",
        content: (
          <>
            <P>
              Your THRYLOS INDIA account provides access to the platform areas associated with your account and
              projects. Open{" "}
              <Link className="text-primary underline" to="/auth">
                Sign in
              </Link>{" "}
              to begin.
            </P>

            <P>
              Depending on the authentication options currently available, you can use Google authentication or
              email-based authentication.
            </P>

            <UL
              items={[
                "Continue with Google — authenticate using your Google account.",
                "Email and password — authenticate using your registered email and password.",
                "Email verification — complete the 6-digit verification code step when requested.",
              ]}
            />

            <CodeBlock
              label="Typical account flow"
              code={`1. Open /auth
2. Enter your email or choose Google
3. Complete the authentication step
4. If requested, enter the 6-digit verification code
5. Continue into your account
6. Open /dashboard to access your account area`}
            />

            <H3>Email verification codes</H3>
            <P>
              The current platform documentation describes a 6-digit verification code sent to your email. The code is
              valid for 10 minutes and verification attempts are limited.
            </P>

            <UL
              items={[
                "Use the newest code if you requested more than one.",
                "Do not share the code with another person.",
                "Do not repeatedly submit an expired code.",
                "If a code expires, request a new one.",
                "Check your spam or filtered folders if the email does not appear.",
              ]}
            />

            <Note title="Keep your account credentials private">
              THRYLOS INDIA support does not need your password or OTP for ordinary account assistance. Never provide
              authentication codes to someone who asks for them over phone, WhatsApp, email or chat.
            </Note>

            <H3>If you cannot sign in</H3>
            <P>
              First verify that you are using the correct email address and the official THRYLOS INDIA website. If the
              issue continues, contact support and describe the error without sending your password or verification
              code.
            </P>
          </>
        ),
      },

      {
        id: "dashboard",
        title: "Your dashboard",
        keywords: "dashboard requests status milestones invoices messages activity",
        content: (
          <>
            <P>
              The dashboard is the main working area for your THRYLOS INDIA account. It provides an overview of service
              requests and project information associated with your account.
            </P>

            <P>
              Depending on the current state of your projects, the dashboard can contain request information, project
              status, milestones, invoices and messages from your project manager.
            </P>

            <DocTable
              head={["Status", "Meaning"]}
              rows={[
                ["Pending", "Request received and awaiting review or the next applicable action"],
                ["In progress", "Work has started and the project is progressing through its milestones"],
                ["Completed", "The project has reached its completed or delivered stage"],
                ["Cancelled", "The request or project has been closed"],
              ]}
            />

            <H3>What should you check?</H3>
            <UL
              items={[
                "Current project status.",
                "Latest milestone information.",
                "Messages from your project manager.",
                "Invoice and payment information.",
                "Requests for additional information.",
                "Final delivery or completion information.",
              ]}
            />

            <H3>Dashboard activity</H3>
            <P>
              Project activity helps keep important updates connected to the relevant request. When a milestone changes
              or new project information becomes available, review the latest activity before making assumptions about
              the current state of the project.
            </P>

            <Note title="Project status is a workflow indicator">
              A status describes the current state of the platform workflow. A project timeline can also depend on
              requirements, feedback, approvals, technical work and other project-specific factors.
            </Note>
          </>
        ),
      },

      {
        id: "account-basics",
        title: "Understanding your account",
        keywords: "account profile username account id settings personal information",
        content: (
          <>
            <P>
              Your account contains the information needed to identify and manage your relationship with the platform.
              Some information is editable directly through Settings, while other information may be associated with
              project, billing or verification records.
            </P>

            <H3>Account information can include</H3>
            <UL
              items={[
                "Your registered email address.",
                "Your account identifier.",
                "Your name.",
                "Your username.",
                "Your profile image where provided.",
                "Project-related information.",
                "Billing-related information.",
                "Communication history associated with your requests.",
              ]}
            />

            <P>
              Your account ID is separate from your username, project ID, invoice number and document verification ID.
            </P>

            <CodeBlock label="Example account ID" code={`THRYLOS26ABC`} />

            <Note title="Keep account information accurate">
              Accurate account information makes project communication and support easier. Only provide information that
              is relevant to the purpose for which it is requested.
            </Note>
          </>
        ),
      },

      {
        id: "getting-help",
        title: "Getting help",
        keywords: "help support assistance contact issue",
        content: (
          <>
            <P>
              If you cannot find an answer in this documentation, use the{" "}
              <Link className="text-primary underline" to="/contact">
                Contact
              </Link>{" "}
              page or the official support email.
            </P>

            <CodeBlock label="Support" code={`support@thrylosindia.in`} />

            <H3>For faster support</H3>
            <UL
              items={[
                "Explain the issue clearly.",
                "Mention the relevant project, invoice or document ID.",
                "Include the approximate time the issue occurred.",
                "Describe the exact action that caused the problem.",
                "Attach a screenshot when it helps explain a visible issue.",
                "Do not include passwords, OTPs, card CVVs or UPI PINs.",
              ]}
            />

            <P>
              A clear support request helps the team identify whether the issue relates to your account, project,
              payment, document verification or another part of the platform.
            </P>
          </>
        ),
      },
    ],
  },

  {
    label: "Projects",
    items: [
      {
        id: "request-service",
        title: "Request a service",
        keywords: "get started service request website app budget timeline requirements",
        content: (
          <>
            <P>
              Use{" "}
              <Link className="text-primary underline" to="/get-started">
                Get Started
              </Link>{" "}
              to describe the digital product or service you want THRYLOS INDIA to work on.
            </P>

            <P>
              A strong project request gives the team enough information to understand your objective, expected scope,
              preferred timeline and design direction.
            </P>

            <H3>Recommended project information</H3>
            <UL
              items={[
                "Type of service.",
                "Project objective.",
                "Target audience.",
                "Required pages or screens.",
                "Required features.",
                "Preferred design direction.",
                "Existing brand guidelines.",
                "Budget range.",
                "Expected timeline.",
                "Preferred language.",
                "Existing website or application if this is a redesign.",
                "Third-party services or integrations.",
                "Any technical constraints.",
              ]}
            />

            <CodeBlock
              label="Example request"
              code={`Service:   Website development
Budget:    ₹25,000 – ₹50,000
Timeline:  4–6 weeks
Language:  English + Hindi

Project:
Five-page business website

Requirements:
Responsive design
Contact form
Services section
Projects section
Basic SEO
Deployment assistance

Design:
Modern, minimal and professional`}
            />

            <P>
              If you already have references, screenshots, brand assets or written requirements, include them as part of
              the project discussion where supported.
            </P>

            <Note title="Describe the outcome, not only the technology">
              A useful brief explains what the product needs to accomplish. The technical implementation can then be
              discussed according to the actual requirements.
            </Note>
          </>
        ),
      },

      {
        id: "project-requirements",
        title: "Preparing project requirements",
        keywords: "requirements scope features specification planning project brief",
        content: (
          <>
            <P>
              Before development begins, requirements should be as clear as reasonably possible. Requirements help
              establish what the project is expected to deliver.
            </P>

            <H3>Functional requirements</H3>
            <UL
              items={[
                "What users should be able to do.",
                "What information users should see.",
                "What forms or interactions are required.",
                "What happens after a user completes an action.",
                "What administrator functions are needed.",
              ]}
            />

            <H3>Visual requirements</H3>
            <UL
              items={[
                "Brand colours.",
                "Logo usage.",
                "Typography preferences.",
                "Reference designs.",
                "Spacing and layout preferences.",
                "Mobile and desktop expectations.",
              ]}
            />

            <H3>Technical requirements</H3>
            <UL
              items={[
                "Authentication.",
                "Database requirements.",
                "Payment integrations.",
                "Email or notification systems.",
                "External APIs.",
                "Hosting or deployment requirements.",
                "Domain requirements.",
              ]}
            />

            <Note title="Clarification is part of planning">
              If an important requirement is unclear, the project manager may need clarification before implementation
              can proceed.
            </Note>
          </>
        ),
      },

      {
        id: "choose-manager",
        title: "Choose a project manager",
        keywords: "project manager choose manager specialisation education past projects",
        content: (
          <>
            <P>
              On{" "}
              <Link className="text-primary underline" to="/choose-manager">
                Choose Manager
              </Link>
              , you can browse available project managers and select one for your request where the feature is
              available.
            </P>

            <H3>Information shown on manager profiles can include</H3>
            <UL
              items={[
                "Specialisation.",
                "Education.",
                "Past projects.",
                "Profile information.",
                "Availability where displayed.",
              ]}
            />

            <P>
              The purpose of manager selection is to help align a project with an appropriate project-management
              profile. It does not remove the need for clear requirements, communication or project review.
            </P>
          </>
        ),
      },

      {
        id: "project-planning",
        title: "Project planning",
        keywords: "planning project scope milestones timeline responsibilities",
        content: (
          <>
            <P>
              After a request is received, the project needs a clear working direction. Planning can include
              understanding the requirements, defining milestones and organising the work required to reach the
              requested outcome.
            </P>

            <H3>Planning can cover</H3>
            <UL
              items={[
                "Project scope.",
                "Feature priorities.",
                "Design direction.",
                "Technical requirements.",
                "Milestone sequence.",
                "Review points.",
                "Expected deliverables.",
                "Client inputs required during the project.",
              ]}
            />

            <P>
              The clearer the requirements are at the planning stage, the less likely the team is to make assumptions
              about the intended result.
            </P>
          </>
        ),
      },

      {
        id: "milestones",
        title: "Milestones & updates",
        keywords: "milestones progress updates activity feed due dates project status",
        content: (
          <>
            <P>
              Your project manager can divide the project into milestones. Milestones represent meaningful stages of
              project progress and make a larger project easier to follow.
            </P>

            <DocTable
              head={["Example milestone", "Purpose"]}
              rows={[
                ["Requirements", "Confirm what the project needs to accomplish"],
                ["Design", "Establish the visual and interaction direction"],
                ["Development", "Implement agreed functionality"],
                ["Review", "Allow the work to be checked against requirements"],
                ["Refinement", "Address applicable corrections and agreed changes"],
                ["Delivery", "Provide the completed project or agreed deliverables"],
              ]}
            />

            <P>
              Each project can have different milestones. The exact structure depends on the service and project
              requirements.
            </P>

            <Note title="Keep up with project updates">
              Review milestone updates and respond to requests for information or feedback as soon as reasonably
              possible.
            </Note>
          </>
        ),
      },

      {
        id: "feedback",
        title: "Providing project feedback",
        keywords: "feedback revisions review changes client approval corrections",
        content: (
          <>
            <P>
              Clear feedback makes project communication more efficient. When reviewing a design or implementation,
              identify the exact element that needs attention and explain the expected change.
            </P>

            <H3>Less useful feedback</H3>
            <CodeBlock label="Example" code={`"Make it better."`} />

            <H3>More useful feedback</H3>
            <CodeBlock
              label="Example"
              code={`Section:
Homepage hero

Issue:
The heading is difficult to read on mobile.

Requested change:
Increase text contrast and reduce the decorative background
behind the heading while keeping the current overall design direction.`}
            />

            <H3>When reviewing a project</H3>
            <UL
              items={[
                "Check the requested feature against the original requirement.",
                "Test important user flows.",
                "Check mobile and desktop layouts.",
                "Review visible text and images.",
                "Test important forms and links.",
                "Separate bugs from new feature requests.",
                "Provide screenshots when they help identify an issue.",
              ]}
            />
          </>
        ),
      },

      {
        id: "project-communication",
        title: "Project communication",
        keywords: "messages communication manager client updates project discussion",
        content: (
          <>
            <P>
              Project communication should remain clear and connected to the relevant request. When discussing an issue,
              include the project context so the project manager can identify which part of the work you are referring
              to.
            </P>

            <H3>Useful project message</H3>
            <CodeBlock
              label="Example"
              code={`Project:
Business Website

Area:
Contact page

Issue:
The phone number displayed in the footer is outdated.

Requested action:
Replace it with the new number supplied in the latest project brief.`}
            />

            <P>
              Avoid sending passwords, OTPs, private API keys or unrelated personal information through ordinary project
              communication.
            </P>
          </>
        ),
      },

      {
        id: "project-files",
        title: "Project files & assets",
        keywords: "project files assets logo images documents upload content",
        content: (
          <>
            <P>
              Projects can require assets such as logos, images, written content, brand guidelines, product information
              and other materials.
            </P>

            <H3>Before providing a file</H3>
            <UL
              items={[
                "Make sure you are authorised to provide it.",
                "Use the latest version.",
                "Give the file a clear name.",
                "Remove unrelated personal information.",
                "Do not include passwords or private keys.",
                "Explain what the file is intended for.",
              ]}
            />

            <Note title="Sensitive credentials">
              Never place passwords, private keys, OTPs or production secrets inside an ordinary project document or
              message.
            </Note>
          </>
        ),
      },

      {
        id: "showcase",
        title: "Showcase on your profile",
        keywords: "showcase portfolio public profile completed project",
        content: (
          <>
            <P>
              Once a project is completed, you can request that the project be shown on your public profile or showcase.
              The current workflow states that showcase requests are reviewed by the coordinator.
            </P>

            <H3>Why approval matters</H3>
            <UL
              items={[
                "Not every project is necessarily intended for public display.",
                "Private client information should not be exposed through a public showcase.",
                "The final showcase information should accurately represent the project.",
                "Approval helps distinguish public portfolio information from private project records.",
              ]}
            />

            <Note title="Public does not mean everything becomes public">
              Project information should not be assumed to be publicly accessible merely because a project exists on the
              platform.
            </Note>
          </>
        ),
      },

      {
        id: "completion",
        title: "Project completion",
        keywords: "completed project delivery handover launch final completion",
        content: (
          <>
            <P>
              A project reaches completion when the applicable agreed work has reached its completion or delivery stage.
            </P>

            <H3>Completion can involve</H3>
            <UL
              items={[
                "Final review.",
                "Applicable corrections.",
                "Delivery of agreed project output.",
                "Deployment assistance where included.",
                "Final project communication.",
                "Completion of applicable billing.",
              ]}
            />

            <P>
              A request for completely new functionality after completion may represent a new requirement rather than a
              correction to the original project.
            </P>
          </>
        ),
      },
    ],
  },

  {
    label: "Payments",
    items: [
      {
        id: "payments",
        title: "Paying invoices",
        keywords: "cashfree payment upi card net banking invoice billing",
        content: (
          <>
            <P>
              Payments are processed by Cashfree Payments using the payment methods made available for the applicable
              invoice. The current documentation identifies UPI, cards and net banking.
            </P>

            <P>THRYLOS INDIA does not see or store your card details through the described payment flow.</P>

            <H3>Before paying</H3>
            <UL
              items={[
                "Confirm that the invoice belongs to your project.",
                "Check the invoice number.",
                "Check the amount.",
                "Review the project or service description.",
                "Check the invoice status.",
                "Use the official payment flow.",
              ]}
            />

            <H3>After paying</H3>
            <UL
              items={[
                "Keep the payment confirmation.",
                "Keep the transaction reference.",
                "Check the invoice status.",
                "Do not immediately submit another payment if the first payment appears delayed.",
              ]}
            />

            <Note title="Never share payment credentials">
              THRYLOS INDIA support does not need your card CVV, UPI PIN, banking password or payment OTP.
            </Note>
          </>
        ),
      },

      {
        id: "invoice",
        title: "Understanding your invoice",
        keywords: "invoice number amount project status date payment billing",
        content: (
          <>
            <P>
              An invoice is the billing record associated with a service or project. Review all visible invoice
              information before completing payment.
            </P>

            <H3>Important invoice information</H3>
            <UL
              items={[
                "Invoice number.",
                "Project or service.",
                "Client information.",
                "Amount.",
                "Issue date.",
                "Payment status.",
                "Applicable payment information.",
                "Verification QR code where provided.",
              ]}
            />

            <P>
              Each invoice can have its own unique identifier. Keep that identifier when contacting support about the
              invoice.
            </P>

            <Note title="Unexpected invoice?">
              If you receive an invoice you were not expecting, do not pay it immediately. Verify the invoice and
              contact official support if the information does not match your project.
            </Note>
          </>
        ),
      },

      {
        id: "payment-status",
        title: "Payment status",
        keywords: "paid pending failed cancelled payment status invoice",
        content: (
          <>
            <DocTable
              head={["Status", "Meaning"]}
              rows={[
                ["Pending", "Payment has not yet been confirmed as completed"],
                ["Paid", "Payment has been confirmed"],
                ["Failed", "The payment attempt did not complete successfully"],
                ["Cancelled", "The relevant payment or request has been cancelled"],
              ]}
            />

            <P>
              Payment status can update after the payment provider confirms the transaction. If the payment provider and
              platform temporarily show different states, keep your transaction reference and contact support rather
              than making assumptions.
            </P>
          </>
        ),
      },

      {
        id: "failed-payment",
        title: "Failed or delayed payment",
        keywords: "failed payment pending debit transaction issue bank upi card",
        content: (
          <>
            <H3>If the payment failed</H3>
            <UL
              items={[
                "Check whether your bank or payment method completed the transaction.",
                "Check whether you received a payment-provider confirmation.",
                "Check the invoice status before trying again.",
                "Keep the failed transaction reference if available.",
              ]}
            />

            <H3>If money was deducted but the invoice remains pending</H3>
            <P>
              Do not immediately make another payment. Keep the transaction reference and contact support with the
              invoice number so the payment can be checked.
            </P>

            <Note title="Avoid duplicate payments">
              A delayed status update does not automatically mean that a payment failed.
            </Note>
          </>
        ),
      },

      {
        id: "refunds",
        title: "Refunds",
        keywords: "refund cancellation refund policy payment return",
        content: (
          <>
            <P>
              Refund eligibility depends on the applicable project stage and the terms in the{" "}
              <Link className="text-primary underline" to="/refund-policy">
                Refund Policy
              </Link>{" "}
              and{" "}
              <Link className="text-primary underline" to="/payment-policy">
                Payment Policy
              </Link>
              .
            </P>

            <H3>Information to include in a refund request</H3>
            <UL
              items={[
                "Invoice number.",
                "Transaction reference.",
                "Payment date.",
                "Amount.",
                "Project or service.",
                "Reason for the request.",
              ]}
            />

            <Note title="Payment safety">
              A refund request does not require your UPI PIN, card CVV, banking password or authentication OTP.
            </Note>
          </>
        ),
      },

      {
        id: "coupons",
        title: "Coupons & discounts",
        keywords: "coupon discount promo promotional code",
        content: (
          <>
            <P>
              Where a coupon field is available, enter the applicable coupon code during the service-request process.
            </P>

            <CodeBlock
              label="Example"
              code={`Coupon:
WELCOME10`}
            />

            <UL
              items={[
                "Coupons can have eligibility conditions.",
                "Coupons can expire.",
                "A coupon can be limited to particular services.",
                "The discount should be reviewed before submitting the request.",
                "Do not assume that an old coupon remains active.",
              ]}
            />
          </>
        ),
      },

      {
        id: "verification-plans",
        title: "Verified accounts",
        keywords: "verified account badge premium verification plans",
        content: (
          <>
            <P>
              Verified members can receive a verification badge and applicable premium features. Current plan details
              and pricing should always be checked on{" "}
              <Link className="text-primary underline" to="/verification-plans">
                Verification Plans
              </Link>
              .
            </P>

            <H3>Verification is separate from project approval</H3>
            <P>
              An account verification badge identifies the account according to the applicable verification process. It
              does not automatically approve every service request or change project requirements.
            </P>
          </>
        ),
      },
    ],
  },

  {
    label: "Documents & QR",
    items: [
      {
        id: "verify",
        title: "Verify a document",
        keywords: "qr verify barcode invoice id hr letter payslip employee document authenticity",
        content: (
          <>
            <P>
              Every invoice, HR letter, payslip and employee ID card issued through the documented THRYLOS INDIA system
              carries a QR code or barcode. A recipient can scan the code or enter the document ID on the{" "}
              <Link className="text-primary underline" to="/verify">
                Verify
              </Link>{" "}
              page.
            </P>

            <H3>Recommended verification process</H3>
            <CodeBlock
              label="Verification flow"
              code={`1. Scan the document QR code
2. Check the destination domain
3. Confirm the official thrylosindia.in domain
4. Check the document ID
5. Compare the displayed details
6. Check the current document status
7. Contact support if the details do not match`}
            />

            <CodeBlock
              label="Public verification URL"
              code={`https://thrylosindia.in/verify/{DOCUMENT_ID}

Example:
https://thrylosindia.in/verify/THR-INV-2026-0042

Employee ID:
https://thrylosindia.in/id/THR-EMP-0007`}
            />

            <H3>Verification information</H3>
            <DocTable
              head={["Document", "What the page shows"]}
              rows={[
                ["Invoice", "Invoice number, project, client, amount, status and dates"],
                ["HR document", "Document type, number, employee name and issue date"],
                ["Employee ID", "Name, designation, department, status and photo"],
              ]}
            />

            <Note title="Public verification">
              Verification pages only show the minimum information needed to confirm authenticity. The current platform
              documentation states that salaries, addresses and ID proofs are not shown.
            </Note>
          </>
        ),
      },

      {
        id: "qr-check",
        title: "How to check a QR code safely",
        keywords: "qr security scan camera google lens verification safety",
        content: (
          <>
            <P>
              A QR code is a convenient way to open a verification record, but the presence of a QR image by itself does
              not establish authenticity. The destination and verification record should always be checked.
            </P>

            <H3>Check these details</H3>
            <UL
              items={[
                "The QR should open the expected THRYLOS INDIA domain.",
                "The document ID should correspond to the document.",
                "The displayed name or document details should match.",
                "The document status should be reviewed.",
                "Unexpected redirects should be treated cautiously.",
              ]}
            />

            <Note title="Copied QR codes">
              A QR image can be copied from one document onto another. Always compare the official verification record
              with the document you received.
            </Note>
          </>
        ),
      },

      {
        id: "document-result",
        title: "Understanding verification results",
        keywords: "verification result valid invalid document not found mismatch",
        content: (
          <>
            <DocTable
              head={["Result", "Recommended action"]}
              rows={[
                ["Record found and details match", "The verification record corresponds to the information shown."],
                ["Record found but details differ", "Do not rely on the document until the discrepancy is clarified."],
                ["Record not found", "Contact official support before relying on the document."],
                ["Unexpected status", "Review the status and contact support if clarification is needed."],
              ]}
            />

            <P>
              Verification should be performed against the official verification record rather than against screenshots
              or copied links supplied by another person.
            </P>
          </>
        ),
      },

      {
        id: "id-card",
        title: "Digital ID cards",
        keywords: "digital employee id card pdf public link flip card verification",
        content: (
          <>
            <P>
              Employee ID cards can have a shareable public verification link. The card can contain information used to
              identify the employee and confirm the card's status.
            </P>

            <H3>When checking an ID</H3>
            <UL
              items={[
                "Confirm the employee name.",
                "Check designation.",
                "Check department where displayed.",
                "Check the current status.",
                "Compare the photo where applicable.",
                "Use the public verification page rather than relying only on a screenshot.",
              ]}
            />

            <P>
              Where supported, the digital card can be opened to view the reverse side and a PDF can be downloaded for a
              print-accurate copy.
            </P>
          </>
        ),
      },

      {
        id: "document-privacy",
        title: "Document privacy",
        keywords: "document privacy public verification salary address identity proof",
        content: (
          <>
            <P>
              Document verification is designed to confirm authenticity without unnecessarily publishing the complete
              underlying document.
            </P>

            <UL
              items={[
                "Public verification does not expose the complete private document.",
                "Salaries are not shown on the public verification pages described in this guide.",
                "Addresses are not shown on those public verification pages.",
                "Identity proofs are not shown on those public verification pages.",
                "Only information needed for verification should be exposed publicly.",
              ]}
            />

            <Note title="Share the verification record, not unnecessary personal data">
              When another person needs to verify a document, use the official verification link or QR instead of
              sending additional private records that are not required.
            </Note>
          </>
        ),
      },
    ],
  },

  {
    label: "Your Account & Data Rights",
    items: [
      {
        id: "profile",
        title: "Profile & username",
        keywords: "profile username name photo settings account",
        content: (
          <>
            <P>
              You can edit available profile information through{" "}
              <Link className="text-primary underline" to="/settings">
                Settings
              </Link>
              .
            </P>

            <UL
              items={[
                "Name can be edited where the interface permits it.",
                "Profile photo can be updated where supported.",
                "Usernames are 5–25 characters according to the current documentation.",
                "Usernames can be changed once every 30 days according to the current documentation.",
                "Your username is separate from your account ID.",
              ]}
            />

            <P>The documented account identifier uses a format similar to:</P>

            <CodeBlock label="Example" code={`THRYLOS26ABC`} />
          </>
        ),
      },

      {
        id: "security",
        title: "Security tips",
        keywords: "security password otp phishing account protection sessions",
        content: (
          <>
            <P>
              Account security begins with protecting the credentials and authentication methods connected to your
              account.
            </P>

            <H3>Never share</H3>
            <UL
              items={[
                "Your password.",
                "Your OTP or email verification code.",
                "Your UPI PIN.",
                "Your card CVV.",
                "Your banking password.",
                "Private API keys.",
                "Authentication tokens.",
              ]}
            />

            <H3>Recommended security habits</H3>
            <UL
              items={[
                "Use the official THRYLOS INDIA domain when signing in.",
                "Use a strong and unique password where password authentication is used.",
                "Keep your email account secure.",
                "Review active sessions where available.",
                "Sign out devices you do not recognise.",
                "Be careful with unexpected payment links.",
                "Verify documents through the official verification page.",
                "Report suspicious account activity.",
              ]}
            />

            <CodeBlock
              label="Official email guidance"
              code={`Official documented contacts:

support@thrylosindia.in
invoice@thrylosindia.in
founder@thrylosindia.in`}
            />

            <Note title="Support does not require secrets">
              Never provide an OTP, password, UPI PIN or card CVV to someone claiming to be support.
            </Note>
          </>
        ),
      },

      {
        id: "your-data",
        title: "Your account and personal data",
        keywords: "personal data account information privacy data protection",
        content: (
          <>
            <P>
              Your use of THRYLOS INDIA can involve different categories of information depending on which features you
              use.
            </P>

            <DocTable
              head={["Area", "Examples"]}
              rows={[
                ["Account", "Email, authentication information and account identifier"],
                ["Profile", "Name, username and profile image where provided"],
                ["Projects", "Requirements, project information, milestones and communications"],
                ["Payments", "Invoice information, payment status and transaction references"],
                ["Documents", "Document IDs and limited information used for verification"],
                ["Support", "Information included in your support request"],
              ]}
            />

            <P>
              Not every user provides every category of information. The information associated with an account depends
              on the services and features used by that person.
            </P>
          </>
        ),
      },

      {
        id: "dpdp",
        title: "Your data rights under India's DPDP Act",
        keywords:
          "DPDP Act Digital Personal Data Protection Act 2023 data rights privacy access correction erasure consent grievance",
        content: (
          <>
            <P>
              India's Digital Personal Data Protection Act, 2023 establishes a legal framework for the processing of
              digital personal data and provides rights and obligations relating to personal data.
            </P>

            <P>
              Depending on the applicable provisions and their commencement, Data Principals can have rights relating to
              information about their personal data, correction and erasure, grievance redressal, nomination and
              withdrawal of consent where consent is the applicable basis.
            </P>

            <Note title="Important">
              The DPDP Act contains provisions concerning commencement and implementation. This documentation is an
              informational guide, not legal advice. The Act, applicable rules and official notifications should be
              relied on for the legal position at the relevant time.
            </Note>

            <H3>Access to information</H3>
            <P>
              Where the applicable statutory right is in force and applies to your request, you can use the relevant
              privacy or grievance channel to request information concerning your personal data.
            </P>

            <H3>Correction</H3>
            <P>
              If information associated with your account is inaccurate or incomplete, you can request correction
              through the applicable account or privacy channel.
            </P>

            <H3>Erasure</H3>
            <P>
              Where applicable, you can request erasure of personal data, subject to the conditions, exceptions and
              retention requirements that apply.
            </P>

            <H3>Withdrawal of consent</H3>
            <P>
              Where consent is the applicable basis for processing, you can request withdrawal of that consent.
              Withdrawal can affect services that depend on the relevant processing.
            </P>

            <H3>Grievance redressal</H3>
            <P>
              If you have a personal-data concern that is not resolved through ordinary support, use the published
              grievance contact.
            </P>

            <CodeBlock
              label="Privacy / grievance contact"
              code={`Grievance Officer:
Utsav Ratan

Email:
founder@thrylosindia.in

Support:
support@thrylosindia.in

Address:
THRYLOS INDIA, New Delhi, India`}
            />

            <H3>What should a data request contain?</H3>
            <CodeBlock
              label="Example"
              code={`Subject: Personal Data Request

Account email:
[Your registered email]

Request:
Access / Correction / Erasure / Consent withdrawal / Grievance

Details:
[Clearly describe the request]

Relevant account or project ID:
[If applicable]`}
            />

            <Note title="Identity verification">
              A privacy request may require reasonable verification that the requester is the person associated with the
              information. Do not send unnecessary sensitive documents when making a request.
            </Note>

            <P>
              For the platform's detailed privacy terms, read the{" "}
              <Link className="text-primary underline" to="/privacy-policy">
                Privacy Policy
              </Link>
              . For browser technologies and related information, read the{" "}
              <Link className="text-primary underline" to="/cookie-policy">
                Cookie Policy
              </Link>
              .
            </P>
          </>
        ),
      },

      {
        id: "correct-data",
        title: "Correct your data",
        keywords: "correct data update inaccurate information privacy correction",
        content: (
          <>
            <P>
              If you notice that personal information associated with your account is incorrect, first use the available
              Settings controls if the information is directly editable.
            </P>

            <H3>If you cannot edit the information yourself</H3>
            <UL
              items={[
                "Contact the applicable support or privacy channel.",
                "Identify the account.",
                "Identify the incorrect information.",
                "Provide the corrected information.",
                "Explain why the correction is required.",
              ]}
            />

            <Note title="Provide only what is necessary">
              A correction request should contain enough information to locate the relevant record without unnecessarily
              disclosing unrelated sensitive information.
            </Note>
          </>
        ),
      },

      {
        id: "delete-data",
        title: "Erasure and deletion requests",
        keywords: "delete data erase personal data account deletion privacy",
        content: (
          <>
            <P>
              Where applicable, you can request erasure of personal data through the relevant privacy or grievance
              process.
            </P>

            <P>
              A deletion request does not necessarily mean that every record can be removed immediately. Certain
              information may be subject to applicable legal, accounting, contractual, security or other retention
              requirements.
            </P>

            <H3>Include</H3>
            <UL
              items={[
                "Your account email.",
                "Account or project ID where available.",
                "The information or category of information involved.",
                "A clear description of what you want addressed.",
              ]}
            />
          </>
        ),
      },

      {
        id: "consent",
        title: "Consent and withdrawal",
        keywords: "consent withdraw consent data processing permission",
        content: (
          <>
            <P>
              Consent can be relevant where processing is based on consent. Where consent is the applicable basis, the
              DPDP framework provides for withdrawal of consent.
            </P>

            <P>
              Withdrawal can have consequences where a service depends on the relevant processing. Processing that was
              lawfully carried out before withdrawal is not automatically made unlawful merely because consent is later
              withdrawn.
            </P>

            <H3>Before requesting withdrawal</H3>
            <UL
              items={[
                "Identify what consent or processing you are referring to.",
                "Use an available account control if provided.",
                "Contact the privacy/grievance channel if a direct control is unavailable.",
                "Understand that some functionality can depend on the relevant processing.",
              ]}
            />
          </>
        ),
      },

      {
        id: "privacy-policy",
        title: "Privacy Policy & Cookie Policy",
        keywords: "privacy policy cookie policy data processing cookies",
        content: (
          <>
            <P>
              This documentation explains how to use the platform. The formal platform-specific privacy information is
              available in the{" "}
              <Link className="text-primary underline" to="/privacy-policy">
                Privacy Policy
              </Link>
              .
            </P>

            <P>
              For information about cookies and related browser technologies, use the{" "}
              <Link className="text-primary underline" to="/cookie-policy">
                Cookie Policy
              </Link>
              .
            </P>

            <H3>When should you read these policies?</H3>
            <UL
              items={[
                "Before submitting significant personal information.",
                "When you want to understand platform privacy practices.",
                "When making a data-related request.",
                "When you have questions about cookies or browser storage.",
                "When reviewing how your information relates to a particular feature.",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    label: "FAQs",
    items: [
      {
        id: "faq",
        title: "Frequently asked questions",
        keywords: "faq questions answers help support common questions",
        content: (
          <>
            <H3>Where is THRYLOS INDIA based?</H3>
            <P>
              The current platform documentation identifies THRYLOS INDIA as being based in New Delhi, India, while
              working with clients across India and abroad.
            </P>

            <H3>How do I create an account?</H3>
            <P>
              Open{" "}
              <Link className="text-primary underline" to="/auth">
                Sign in
              </Link>{" "}
              and choose the authentication option available to you.
            </P>

            <H3>How long is the verification code valid?</H3>
            <P>The current documentation specifies that the 6-digit code is valid for 10 minutes.</P>

            <H3>I did not receive my code. What should I do?</H3>
            <P>
              Check spam or filtered folders, wait briefly and request a new code. Make sure you are checking the inbox
              associated with the account.
            </P>

            <H3>Can I request a website?</H3>
            <P>
              Yes. Use{" "}
              <Link className="text-primary underline" to="/get-started">
                Get Started
              </Link>{" "}
              and describe your requirements, budget and timeline.
            </P>

            <H3>Can I request an application?</H3>
            <P>
              The documentation describes THRYLOS INDIA as a digital services studio that designs and builds websites,
              web applications and mobile applications. Use the service-request flow to describe your specific
              requirements.
            </P>

            <H3>Can I choose a project manager?</H3>
            <P>
              The platform provides a{" "}
              <Link className="text-primary underline" to="/choose-manager">
                Choose Manager
              </Link>{" "}
              flow where available managers can be reviewed and selected.
            </P>

            <H3>Where can I see my project?</H3>
            <P>
              Your dashboard provides the main project overview, including request status, milestones, invoices and
              project-related messages.
            </P>

            <H3>What does Pending mean?</H3>
            <P>It means that the request has been received and is waiting for review or the next applicable action.</P>

            <H3>What does In progress mean?</H3>
            <P>It means work has started and the project is progressing through its applicable milestones.</P>

            <H3>What does Completed mean?</H3>
            <P>It means the project has reached its completed or delivered stage.</P>

            <H3>What does Cancelled mean?</H3>
            <P>It means the relevant request or project has been closed.</P>

            <H3>How are payments processed?</H3>
            <P>
              The current documentation identifies Cashfree Payments as the payment processor and lists UPI, cards and
              net banking.
            </P>

            <H3>Does THRYLOS INDIA see my card details?</H3>
            <P>
              The current documentation states that THRYLOS INDIA does not see or store card details through the
              described Cashfree payment process.
            </P>

            <H3>My payment was deducted but the invoice is pending. What should I do?</H3>
            <P>
              Do not immediately pay again. Keep the transaction reference and contact support with the invoice number
              so the payment can be checked.
            </P>

            <H3>How do I verify an invoice?</H3>
            <P>
              Scan the invoice QR code or enter the document ID on the{" "}
              <Link className="text-primary underline" to="/verify">
                Verify
              </Link>{" "}
              page.
            </P>

            <H3>How do I verify an employee ID?</H3>
            <P>
              Use the official verification link or QR associated with the employee ID and compare the displayed
              information with the card.
            </P>

            <H3>What if the QR code does not work?</H3>
            <P>
              If the document contains a document ID, enter it manually on the Verify page. If the record cannot be
              found, contact official support.
            </P>

            <H3>What if the verification details do not match?</H3>
            <P>
              Do not assume the document is genuine. Stop relying on it and contact official support with the document
              ID.
            </P>

            <H3>Can I change my username?</H3>
            <P>
              The current documentation states that usernames are 5–25 characters and can be changed once every 30 days.
            </P>

            <H3>Where can I edit my profile?</H3>
            <P>
              Use{" "}
              <Link className="text-primary underline" to="/settings">
                Settings
              </Link>{" "}
              for the profile information currently made editable.
            </P>

            <H3>What should I do if I see an unfamiliar session?</H3>
            <P>
              Sign out the unfamiliar session where supported, secure your account credentials and contact support if
              you suspect unauthorised activity.
            </P>

            <H3>Should I share my OTP with support?</H3>
            <P>No. Never disclose your OTP or verification code to another person.</P>

            <H3>Should I share my UPI PIN?</H3>
            <P>No. Your UPI PIN is private and should never be provided to support or a project manager.</P>

            <H3>Should I share my card CVV?</H3>
            <P>No. Never send your card CVV through support chat, email, WhatsApp or project communication.</P>

            <H3>What is the DPDP Act?</H3>
            <P>
              The Digital Personal Data Protection Act, 2023 is India's legislation establishing a framework for
              processing digital personal data and related rights and obligations.
            </P>

            <H3>Can I request access to information about my personal data?</H3>
            <P>
              Applicable DPDP provisions provide rights relating to information about personal data, subject to the
              applicable law and its commencement and conditions.
            </P>

            <H3>Can I ask for incorrect personal data to be corrected?</H3>
            <P>
              Applicable DPDP provisions provide for correction of inaccurate or incomplete personal data, subject to
              the applicable requirements.
            </P>

            <H3>Can I request deletion of personal data?</H3>
            <P>
              Applicable DPDP provisions provide for erasure in relevant circumstances, subject to applicable legal
              conditions and retention requirements.
            </P>

            <H3>Can I withdraw consent?</H3>
            <P>
              Where consent is the applicable basis for processing, the DPDP framework provides for withdrawal of
              consent. Withdrawal can affect processing that depends on that consent.
            </P>

            <H3>Who should I contact for a privacy grievance?</H3>
            <P>
              The current documentation identifies Utsav Ratan as the Grievance Officer and provides{" "}
              <code className="rounded bg-muted px-1">founder@thrylosindia.in</code> as the grievance contact.
            </P>

            <H3>Who should I contact for ordinary support?</H3>
            <P>
              Use <code className="rounded bg-muted px-1">support@thrylosindia.in</code> or the{" "}
              <Link className="text-primary underline" to="/contact">
                Contact
              </Link>{" "}
              page.
            </P>

            <H3>How do I request a refund?</H3>
            <P>
              Review the{" "}
              <Link className="text-primary underline" to="/refund-policy">
                Refund Policy
              </Link>{" "}
              and{" "}
              <Link className="text-primary underline" to="/payment-policy">
                Payment Policy
              </Link>
              , then contact the applicable support channel with your invoice and transaction information.
            </P>

            <H3>Can I showcase my completed project?</H3>
            <P>
              You can request a project showcase after completion. Showcase requests are subject to coordinator
              approval.
            </P>

            <H3>What should I do if my project has a bug?</H3>
            <P>
              Provide the project context, affected page or feature, steps to reproduce the issue and a screenshot when
              useful. This makes the issue easier to investigate.
            </P>

            <H3>What if I want a completely new feature after completion?</H3>
            <P>
              Discuss the new requirement with your project manager. New functionality can require separate project
              scope and assessment.
            </P>

            <H3>What if I receive a suspicious invoice?</H3>
            <P>
              Do not pay it immediately. Check the invoice details and verification record, then contact official
              support.
            </P>

            <H3>What if someone sends me a THRYLOS INDIA document outside the official platform?</H3>
            <P>
              Use the official verification mechanism to check the document. Do not rely only on a screenshot, forwarded
              message or copied QR code.
            </P>

            <H3>What if a verification page shows information I do not expect?</H3>
            <P>
              Compare the information with the original document. If there is a discrepancy or privacy concern, contact
              support using the official contact information.
            </P>

            <H3>Can I contact support about a project payment?</H3>
            <P>
              Yes. Include the invoice number and transaction reference where available, but never include your payment
              password, UPI PIN, CVV or OTP.
            </P>

            <H3>Can I contact support about a document?</H3>
            <P>
              Yes. Include the document ID or verification link so the issue can be identified without sending
              unnecessary private records.
            </P>

            <H3>What is the difference between an account ID and a document ID?</H3>
            <P>
              An account ID identifies your platform account, while a document ID identifies a particular document or
              verification record.
            </P>

            <H3>What is the difference between a project ID and an invoice number?</H3>
            <P>
              A project ID identifies the project or request, while an invoice number identifies the billing document
              associated with a transaction or project.
            </P>

            <H3>Can I use a document screenshot as proof?</H3>
            <P>
              A screenshot can be copied or modified. When authenticity matters, use the official verification record
              and compare it with the document.
            </P>

            <H3>Where can I find the formal policies?</H3>
            <P>
              The platform provides dedicated pages for the Privacy Policy, Cookie Policy, Payment Policy and Refund
              Policy. Use those pages when you need the formal policy rather than this user guide.
            </P>
          </>
        ),
      },
    ],
  },
];

const PublicDocs = () => (
  <>
    <SEO
      title="Help & Documentation | THRYLOS INDIA"
      description="Detailed THRYLOS INDIA user documentation covering getting started, accounts, projects, project management, payments, invoices, refunds, document and QR verification, account security, privacy, data rights and FAQs."
      path="/docs"
    />

    <DocsShell
      title="Help & Documentation"
      subtitle="Everything you need to work with THRYLOS INDIA — from getting started and managing projects to payments, document verification, account security, privacy and data rights."
      badge="User Guide"
      groups={groups}
    />
  </>
);

export default PublicDocs;
