import type { MetaFunction } from "@react-router/cloudflare";
import { Catalyst } from "@cai/ui-tw";

export const meta: MetaFunction = () => {
  return [
    { title: "Catalyst UI Test" },
  ];
};

export default function CatalystTest() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Catalyst.Heading>Catalyst UI Components Test</Catalyst.Heading>
      
      <div className="space-y-8 mt-8">
        <section>
          <Catalyst.Subheading>Buttons</Catalyst.Subheading>
          <div className="flex gap-4 mt-4">
            <Catalyst.Button>Primary Button</Catalyst.Button>
            <Catalyst.Button color="zinc">Secondary Button</Catalyst.Button>
            <Catalyst.Button color="white">White Button</Catalyst.Button>
          </div>
        </section>

        <section>
          <Catalyst.Subheading>Form Elements</Catalyst.Subheading>
          <div className="space-y-4 mt-4">
            <Catalyst.Field>
              <Catalyst.Label>Email</Catalyst.Label>
              <Catalyst.Input type="email" placeholder="Enter your email" />
            </Catalyst.Field>
            
            <Catalyst.Field>
              <Catalyst.Label>Message</Catalyst.Label>
              <Catalyst.Textarea placeholder="Enter your message" />
            </Catalyst.Field>
          </div>
        </section>

        <section>
          <Catalyst.Subheading>Badge & Alert</Catalyst.Subheading>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Catalyst.Badge>Default</Catalyst.Badge>
              <Catalyst.Badge color="blue">Blue</Catalyst.Badge>
              <Catalyst.Badge color="green">Green</Catalyst.Badge>
            </div>
            
            <Catalyst.Alert onClose={() => {}}>This is an alert message using Catalyst UI!</Catalyst.Alert>
          </div>
        </section>
      </div>
    </div>
  );
}