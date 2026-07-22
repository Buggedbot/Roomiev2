"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, Heart, MessageCircle, Wallet, Moon, Sparkles, X, Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const steps = [
  {
    icon: UserPlus,
    title: "Create your profile",
    body: "Budget, schedule, cleanliness, food — the stuff that actually determines whether living together works.",
  },
  {
    icon: Heart,
    title: "Swipe & match",
    body: "See a compatibility score and exactly why you clicked before you ever say hi.",
  },
  {
    icon: MessageCircle,
    title: "Chat & move in",
    body: "Once you both match, message directly and sort out the details.",
  },
];

const features = [
  {
    icon: Wallet,
    title: "Compatibility scoring",
    body: "A transparent score built from budget, cleanliness, sleep schedule, and more — with the reasoning shown, not hidden.",
  },
  {
    icon: Sparkles,
    title: "Swipe to connect",
    body: "Browse student profiles ranked by fit and match with the ones you click with.",
  },
  {
    icon: MessageCircle,
    title: "Chat once matched",
    body: "Message your matches directly to plan the details before moving in together.",
  },
];

export function LandingHero() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center blur-3xl"
      >
        <div className="h-72 w-[36rem] rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 opacity-60" />
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 pb-24 pt-16 lg:grid-cols-2 lg:pt-24">
        <div className="text-center lg:text-left">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-4xl font-bold tracking-tight sm:text-6xl"
          >
            Find your perfect{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              roommate
            </span>
            , not just a room.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-6 text-lg text-muted"
          >
            RoomieMatch matches students by budget, lifestyle, and habits —
            swipe, match, and chat with people you&apos;ll actually enjoy
            living with.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
          >
            <Link
              href="/register"
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition hover:scale-[1.03] hover:opacity-90 sm:w-auto"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="w-full rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-foreground/5 sm:w-auto"
            >
              Log in
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative mx-auto w-full max-w-sm"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10"
          >
            <div className="flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 py-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                P
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">Shayan, 22</h3>
                  <p className="text-xs text-muted">
                    Design · Koramangala
                  </p>
                </div>
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-bold leading-none">91%</span>
                  <span className="text-[9px] leading-none">match</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Early riser", "Very clean", "Vegetarian"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-foreground/5 px-2.5 py-1 text-[11px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted">
                  <X className="h-4 w-4" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-muted">
                  <Star className="h-4 w-4" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Heart className="h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -left-8 top-10 hidden items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-lg sm:flex"
          >
            <Moon className="h-4 w-4 text-primary" /> Same sleep schedule
          </motion.div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-6 bottom-16 hidden items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-lg sm:flex"
          >
            <Wallet className="h-4 w-4 text-primary" /> Budgets overlap
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          How it works
        </motion.h2>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-28">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-card/60 p-6 text-left transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-28 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-10"
        >
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your next roommate is one swipe away.
          </h2>
          <p className="mt-3 text-muted">
            Free to join. Takes about two minutes to set up your profile.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition hover:scale-[1.03] hover:opacity-90"
          >
            Get started — it&apos;s free
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
