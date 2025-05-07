import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <HeroSection>
        <HeroContent>
          <Title>Connect with anyone, anywhere</Title>
          <Subtitle>Fast, secure messaging for free</Subtitle>
          <CTAButton onClick={() => navigate('/login')}>Get Started</CTAButton>
        </HeroContent>
        <HeroImage src="https://illustrations.popsy.co/amber/digital-nomad.svg" alt="Chat illustration" />
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Why Choose Our Chat App</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>🚀</FeatureIcon>
            <FeatureTitle>Lightning Fast</FeatureTitle>
            <FeatureDescription>
              Real-time messaging with minimal latency for seamless conversations.
            </FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>End-to-End Encryption</FeatureTitle>
            <FeatureDescription>
              Your conversations are private and secure with military-grade encryption.
            </FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>💬</FeatureIcon>
            <FeatureTitle>Group Chats</FeatureTitle>
            <FeatureDescription>
              Connect with multiple people at once in organized group conversations.
            </FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🎨</FeatureIcon>
            <FeatureTitle>Customizable</FeatureTitle>
            <FeatureDescription>
              Personalize your chat experience with themes, colors, and more.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      <TestimonialsSection>
        <SectionTitle>What Our Users Say</SectionTitle>
        <TestimonialsGrid>
          <TestimonialCard>
            <TestimonialText>
              "This chat app has completely changed how I communicate with my team. The interface is so intuitive!"
            </TestimonialText>
            <TestimonialAuthor>- Sarah K., Project Manager</TestimonialAuthor>
          </TestimonialCard>
          <TestimonialCard>
            <TestimonialText>
              "I love the security features. Finally a chat app that takes privacy seriously."
            </TestimonialText>
            <TestimonialAuthor>- Michael T., Developer</TestimonialAuthor>
          </TestimonialCard>
        </TestimonialsGrid>
      </TestimonialsSection>

      <BottomCTA>
        <CTATitle>Ready to start chatting?</CTATitle>
        <CTAButton onClick={() => navigate('/signup')}>Create Account</CTAButton>
      </BottomCTA>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80px 0;
  gap: 40px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 40px 0;
  }
`;

const HeroContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 20px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #4a5568;
  margin-bottom: 30px;
  max-width: 500px;
`;

const HeroImage = styled.img`
  flex: 1;
  max-width: 500px;
  height: auto;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const CTAButton = styled.button`
  background:rgb(22, 92, 77);
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgb(41, 146, 123);
    transform: translateY(-2px);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 0;
  background: #f7fafc;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 50px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  color: #2d3748;
  margin-bottom: 15px;
`;

const FeatureDescription = styled.p`
  color: #4a5568;
  line-height: 1.6;
`;

const TestimonialsSection = styled.section`
  padding: 80px 0;
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 800px;
  margin: 0 auto;
`;

const TestimonialCard = styled.div`
  background: #f7fafc;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const TestimonialText = styled.p`
  font-style: italic;
  color: #4a5568;
  margin-bottom: 20px;
  line-height: 1.6;
`;

const TestimonialAuthor = styled.p`
  font-weight: 600;
  color: #2d3748;
`;

const BottomCTA = styled.div`
  text-align: center;
  padding: 80px 0;
  background:rgb(41, 146, 123);
  color: white;
  border-radius: 8px;
  margin: 40px 0;
`;

const CTATitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 30px;
`;

export default Home;