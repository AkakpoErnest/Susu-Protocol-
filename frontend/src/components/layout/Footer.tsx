import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-primary font-heading font-bold text-xs">S</span>
              </div>
              <span className="font-heading font-bold text-text-primary">Susu Protocol</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Bringing the ancient rotating savings tradition of West Africa to Polkadot.
              Trustless, transparent, and borderless.
            </p>
          </div>

          {/* Network */}
          <div>
            <h4 className="font-heading font-semibold text-text-primary mb-3">Network</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Polkadot Hub Westend Testnet</li>
              <li>Chain ID: 420420421</li>
              <li>
                <a
                  href="https://blockscout.westend.asset-hub.paritytech.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                  Block Explorer <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.polkadot.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                  WND Faucet <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-text-primary mb-3">Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <Github size={14} /> GitHub
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-accent transition-colors"
                >
                  Discord (coming soon)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-accent transition-colors"
                >
                  Docs (coming soon)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Built for the Polkadot Solidity Hackathon 2026 · MIT License
          </p>
          <p className="text-xs text-gray-500">
            Testnet only — not for real funds
          </p>
        </div>
      </div>
    </footer>
  );
}
