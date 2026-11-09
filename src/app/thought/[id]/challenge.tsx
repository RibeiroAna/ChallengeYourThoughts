import { useLocalSearchParams } from 'expo-router';

import { ThoughtFlow } from '../../../flow/ThoughtFlow';

export default function ChallengeScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  return <ThoughtFlow thoughtId={Number(id)} initialStep={step ? Number(step) : undefined} />;
}
