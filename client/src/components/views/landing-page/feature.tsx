import { BentoCard, BentoGrid } from "@/components/bento-grid";
import {
  GitGraph,
  GitMerge,
  GitPullRequestArrow,
  Star,
  Trophy,
} from "lucide-react";

const features = [
  {
    Icon: GitPullRequestArrow,
    name: "Manage Pull Requests",
    description:
      "Automate PR reviews, merges, and status tracking with Gitstark.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: GitGraph,
    name: "Create & Track Issues",
    description:
      "Easily create, assign, and track issues across your repositories.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: Trophy,
    name: "Reward Contributors",
    description:
      "Distribute STRK or LORDS tokens to contributors for their valuable work.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: GitMerge,
    name: "Automate PR Merges",
    description:
      "Automatically merge PRs that meet your criteria, saving you time.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: Star,
    name: "Recognize Top Contributors",
    description:
      "Highlight and reward top contributors with STRK or LORDS tokens and badges.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

export function Features() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 bg-transparent">
      <BentoGrid className="lg:grid-rows-3">
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
}
