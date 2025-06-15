import { Catalyst } from '@t4/ui-tw'
import React from 'react'

export default function CatalystDemo() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <Catalyst.Heading level={1}>Catalyst UI Components</Catalyst.Heading>
          <Catalyst.Text className="mt-2">
            A collection of beautiful, accessible components built with Headless UI and Tailwind CSS.
            Note: These components are web-only and won't work in React Native.
          </Catalyst.Text>
        </div>

        <Catalyst.Divider />

        {/* Buttons Section */}
        <section className="space-y-4">
          <Catalyst.Heading level={2}>Buttons</Catalyst.Heading>
          <div className="flex flex-wrap gap-4">
            <Catalyst.Button color="light">Light</Catalyst.Button>
            <Catalyst.Button color="dark">Dark</Catalyst.Button>
            <Catalyst.Button color="cyan">Cyan</Catalyst.Button>
            <Catalyst.Button color="red">Red</Catalyst.Button>
            <Catalyst.Button color="orange">Orange</Catalyst.Button>
            <Catalyst.Button color="amber">Amber</Catalyst.Button>
            <Catalyst.Button color="yellow">Yellow</Catalyst.Button>
            <Catalyst.Button color="lime">Lime</Catalyst.Button>
            <Catalyst.Button color="green">Green</Catalyst.Button>
            <Catalyst.Button color="emerald">Emerald</Catalyst.Button>
            <Catalyst.Button color="teal">Teal</Catalyst.Button>
            <Catalyst.Button color="sky">Sky</Catalyst.Button>
            <Catalyst.Button color="blue">Blue</Catalyst.Button>
            <Catalyst.Button color="indigo">Indigo</Catalyst.Button>
            <Catalyst.Button color="violet">Violet</Catalyst.Button>
            <Catalyst.Button color="purple">Purple</Catalyst.Button>
            <Catalyst.Button color="fuchsia">Fuchsia</Catalyst.Button>
            <Catalyst.Button color="pink">Pink</Catalyst.Button>
            <Catalyst.Button color="rose">Rose</Catalyst.Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Catalyst.Button outline>Outline</Catalyst.Button>
            <Catalyst.Button plain>Plain</Catalyst.Button>
            <Catalyst.Button disabled>Disabled</Catalyst.Button>
          </div>
        </section>

        <Catalyst.Divider />

        {/* Form Elements Section */}
        <section className="space-y-6">
          <Catalyst.Heading level={2}>Form Elements</Catalyst.Heading>
          
          <Catalyst.FieldGroup>
            <Catalyst.Field>
              <Catalyst.Label>Email</Catalyst.Label>
              <Catalyst.Input type="email" placeholder="you@example.com" />
            </Catalyst.Field>

            <Catalyst.Field>
              <Catalyst.Label>Password</Catalyst.Label>
              <Catalyst.Input type="password" />
            </Catalyst.Field>

            <Catalyst.Field>
              <Catalyst.Label>Message</Catalyst.Label>
              <Catalyst.Textarea placeholder="Enter your message..." rows={4} />
            </Catalyst.Field>

            <Catalyst.Field>
              <Catalyst.Label>Country</Catalyst.Label>
              <Catalyst.Select>
                <option value="">Select a country</option>
                <option value="us">United States</option>
                <option value="ca">Canada</option>
                <option value="mx">Mexico</option>
              </Catalyst.Select>
            </Catalyst.Field>

            <Catalyst.SwitchField>
              <Catalyst.Label>Enable notifications</Catalyst.Label>
              <Catalyst.Description>We'll send you updates about your account.</Catalyst.Description>
              <Catalyst.Switch />
            </Catalyst.SwitchField>

            <Catalyst.Field>
              <Catalyst.Checkbox />
              <Catalyst.Label>I agree to the terms and conditions</Catalyst.Label>
            </Catalyst.Field>
          </Catalyst.FieldGroup>
        </section>

        <Catalyst.Divider />

        {/* Badges Section */}
        <section className="space-y-4">
          <Catalyst.Heading level={2}>Badges</Catalyst.Heading>
          <div className="flex flex-wrap gap-2">
            <Catalyst.Badge>Default</Catalyst.Badge>
            <Catalyst.Badge color="lime">Lime</Catalyst.Badge>
            <Catalyst.Badge color="emerald">Emerald</Catalyst.Badge>
            <Catalyst.Badge color="cyan">Cyan</Catalyst.Badge>
            <Catalyst.Badge color="blue">Blue</Catalyst.Badge>
            <Catalyst.Badge color="violet">Violet</Catalyst.Badge>
            <Catalyst.Badge color="rose">Rose</Catalyst.Badge>
            <Catalyst.Badge color="amber">Amber</Catalyst.Badge>
          </div>
        </section>

        <Catalyst.Divider />

        {/* Alert Section */}
        <section className="space-y-4">
          <Catalyst.Heading level={2}>Alerts</Catalyst.Heading>
          <Catalyst.Alert>
            <Catalyst.Text>A default alert with some information.</Catalyst.Text>
          </Catalyst.Alert>
          <Catalyst.Alert color="amber">
            <Catalyst.Text>A warning alert that needs attention.</Catalyst.Text>
          </Catalyst.Alert>
          <Catalyst.Alert color="emerald">
            <Catalyst.Text>A success alert confirming an action.</Catalyst.Text>
          </Catalyst.Alert>
          <Catalyst.Alert color="rose">
            <Catalyst.Text>An error alert indicating a problem.</Catalyst.Text>
          </Catalyst.Alert>
        </section>

        <Catalyst.Divider />

        {/* Avatar Section */}
        <section className="space-y-4">
          <Catalyst.Heading level={2}>Avatars</Catalyst.Heading>
          <div className="flex items-center gap-4">
            <Catalyst.Avatar src="/catalyst-demo/users/erica.jpg" />
            <Catalyst.Avatar initials="JD" />
            <Catalyst.Avatar />
          </div>
        </section>

        <Catalyst.Divider />

        {/* Table Section */}
        <section className="space-y-4">
          <Catalyst.Heading level={2}>Table</Catalyst.Heading>
          <Catalyst.Table>
            <Catalyst.TableHead>
              <Catalyst.TableRow>
                <Catalyst.TableHeader>Name</Catalyst.TableHeader>
                <Catalyst.TableHeader>Email</Catalyst.TableHeader>
                <Catalyst.TableHeader>Role</Catalyst.TableHeader>
                <Catalyst.TableHeader>Status</Catalyst.TableHeader>
              </Catalyst.TableRow>
            </Catalyst.TableHead>
            <Catalyst.TableBody>
              <Catalyst.TableRow>
                <Catalyst.TableCell>Erica Martinez</Catalyst.TableCell>
                <Catalyst.TableCell>erica@example.com</Catalyst.TableCell>
                <Catalyst.TableCell>Admin</Catalyst.TableCell>
                <Catalyst.TableCell>
                  <Catalyst.Badge color="emerald">Active</Catalyst.Badge>
                </Catalyst.TableCell>
              </Catalyst.TableRow>
              <Catalyst.TableRow>
                <Catalyst.TableCell>John Doe</Catalyst.TableCell>
                <Catalyst.TableCell>john@example.com</Catalyst.TableCell>
                <Catalyst.TableCell>User</Catalyst.TableCell>
                <Catalyst.TableCell>
                  <Catalyst.Badge color="amber">Pending</Catalyst.Badge>
                </Catalyst.TableCell>
              </Catalyst.TableRow>
              <Catalyst.TableRow>
                <Catalyst.TableCell>Jane Smith</Catalyst.TableCell>
                <Catalyst.TableCell>jane@example.com</Catalyst.TableCell>
                <Catalyst.TableCell>User</Catalyst.TableCell>
                <Catalyst.TableCell>
                  <Catalyst.Badge color="rose">Inactive</Catalyst.Badge>
                </Catalyst.TableCell>
              </Catalyst.TableRow>
            </Catalyst.TableBody>
          </Catalyst.Table>
        </section>

        <Catalyst.Divider />

        {/* Description List Section */}
        <section className="space-y-4">
          <Catalyst.Heading level={2}>Description List</Catalyst.Heading>
          <Catalyst.DescriptionList>
            <Catalyst.DescriptionTerm>Full name</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>Erica Martinez</Catalyst.DescriptionDetails>
            
            <Catalyst.DescriptionTerm>Email address</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>erica@example.com</Catalyst.DescriptionDetails>
            
            <Catalyst.DescriptionTerm>Role</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>Administrator</Catalyst.DescriptionDetails>
            
            <Catalyst.DescriptionTerm>Team</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>Engineering</Catalyst.DescriptionDetails>
          </Catalyst.DescriptionList>
        </section>
      </div>
    </div>
  )
}