import { motion } from 'framer-motion';

// Clean transitions - using transform and blur, minimal opacity change to avoid white flash

export function HomeTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, scale: 0.97, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

export function LeaderboardTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

export function LoginTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}

export function TeamProfileTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, y: 25, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

export function ScanTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, scale: 0.94, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}

export function ProfileTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, y: -15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

export function AdminTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, scale: 1.02, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

export function ManageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

export function ExportTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.4, scale: 0.98, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
