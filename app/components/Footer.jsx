"use client";

import Link from "next/link";
import Image from "next/image";
import MpesaLogo from "@/public/assets/mpesa.png";
import AirtelMoney from "@/public/assets/airtelMoney.png";
import VisaCard from "@/public/assets/visa.png";
import MasterCard from "@/public/assets/masterCard.png";
import styles from "@/app/style/footer.module.css";
import { useCommunityStore } from "@/app/store/CommunityStore";
import { FaWhatsapp, FaTiktok, FaInstagram } from "react-icons/fa";

const SOCIAL_LINKS = [
  { name: "instagram", label: "Instagram", Icon: FaInstagram },
  { name: "tiktok", label: "TikTok", Icon: FaTiktok },
  { name: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp },
];

const LINK_COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/tiers", label: "Plans" },
      { href: "/success-stories", label: "Success Stories" },
    ],
  },
  {
    title: "Students",
    links: [
      { href: "/authentication/signup", label: "Enroll" },
      { href: "/authentication/login", label: "Log in" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
];

const PAYMENT_LOGOS = [
  { src: MpesaLogo, alt: "M-Pesa" },
  { src: AirtelMoney, alt: "Airtel Money" },
  { src: VisaCard, alt: "Visa" },
  { src: MasterCard, alt: "Mastercard" },
];

export default function Footer() {
  const openLink = useCommunityStore((state) => state.openLink);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.brand}>
          <h4 className={styles.brandName}>
            Backroom<span>Script</span>
          </h4>
          <p>
            The school that trains you, certifies you and connects you to jobs.
          </p>
          <div className={styles.socialIcons}>
            {SOCIAL_LINKS.map(({ name, label, Icon }) => (
              <button
                key={name}
                type="button"
                aria-label={label}
                className={styles.socialIcon}
                onClick={() => openLink(name)}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.columns}>
          {LINK_COLUMNS.map(({ title, links }) => (
            <div key={title} className={styles.column}>
              <h5>{title}</h5>
              {links.map(({ href, label }) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          ))}

          <div className={styles.column}>
            <h5>Contact</h5>
            <span>United Kingdom</span>
            <span>(+44) 7401-012-610</span>
            <span>backroomscript@gmail.com</span>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} BackroomScript. All rights reserved.</p>
        <div className={styles.payments}>
          <span>Secured payments by</span>
          {PAYMENT_LOGOS.map(({ src, alt }) => (
            <Image
              key={alt}
              src={src}
              alt={alt}
              width={40}
              height={24}
              className={styles.paymentLogo}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}
