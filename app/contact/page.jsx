"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/app/store/AuthStore";
import styles from "@/app/style/contact.module.css";
import Dropdown from "@/app/components/Dropdown";

export default function ContactUs() {
  const { submitContactForm } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const subjectOptions = [
    { value: "template-inquiry", label: "Course Inquiry" },
    { value: "tier-questions", label: "Plan Questions" },
    { value: "access-issues", label: "Access Issues" },
    { value: "technical-support", label: "Technical Support" },
    { value: "coaching-booking", label: "Mentorship Session Booking" },
    { value: "feedback", label: "Feedback" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    const sections = document.querySelectorAll(`.${styles.section}`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach((section) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(20px)";
      section.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectSelect = (option) => {
    setFormData((prev) => ({
      ...prev,
      subject: option.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject) {
      toast.error("Please select a subject");
      return;
    }

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const subjectLabel = subjectOptions.find(
        (opt) => opt.value === formData.subject
      )?.label;

      const result = await submitContactForm(
        formData.email,
        formData.name,
        subjectLabel || "Contact Form",
        formData.message
      );

      if (result.success) {
        toast.success(result.message || "Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSubject = subjectOptions.find(
    (option) => option.value === formData.subject
  );

  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactHeader}>
        <h1>Contact Us</h1>
      </div>

      <div className={styles.section}>
        <h2>Get in Touch with BackroomScript</h2>
        <p>
          We're here to help you learn, get certified and access jobs. Whether
          you have questions about our plans, need assistance with course
          access, or
          want to provide feedback, our support team is ready to assist you.
          Reach out to us through any of the methods below.
        </p>
      </div>

      <div className={styles.section}>
        <h2>Contact Information</h2>
        <div className={styles.contactDetails}>
          <div className={styles.contactItem}>
            <h3>Customer Support</h3>
            <p>
              <strong>Phone:</strong> (+44) 7401-012-610
            </p>
            <p>
              <strong>Email:</strong> backroomscript@gmail.com
            </p>
            <p>
              <strong>Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM GMT
            </p>
          </div>
          <div className={styles.contactItem}>
            <h3>Business Address</h3>
            <p>BackroomScript Ltd.</p>
            <p>United Kingdom</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Send Us a Message</h2>
        <p>
          Have a specific question or need personalized assistance? Fill out
          the form below and we'll get back to you within 24 hours during
          business days.
        </p>

        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email address"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject *</label>
            <div className={styles.dropdownContainer}>
              <Dropdown
                options={subjectOptions}
                onSelect={handleSubjectSelect}
                dropPlaceHolder="Select a subject"
                value={selectedSubject}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows="6"
              placeholder="Please provide details about your inquiry..."
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h2>Frequently Asked Questions</h2>
        <p>
          Before contacting us, you might find the answer to your question in
          our FAQ section:
        </p>
        <ul className={styles.bulletList}>
          <li>
            <strong>Course Access:</strong> Course material is instantly
            accessible after purchase through your dashboard
          </li>
          <li>
            <strong>Plan Upgrades:</strong> You can upgrade to a higher plan at
            any time
          </li>
       
          <li>
            <strong>Mentorship Sessions:</strong> Career students can schedule
            their 1-on-1 mentorship session via email or WhatsApp
          </li>
          <li>
            <strong>Payment:</strong> We accept M-Pesa, Airtel Money, Visa
            and Mastercard through Paystack
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <p>
          <strong>Response Time:</strong> We aim to respond to all inquiries
          within 24 hours during business days. For urgent matters, Career
          students can reach us directly via WhatsApp.
        </p>
      </div>
    </div>
  );
}