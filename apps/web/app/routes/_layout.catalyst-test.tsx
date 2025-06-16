import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { useState } from 'react'
import { 
  BeakerIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_layout/catalyst-test')({
  meta: () => [
    { title: "Catalyst UI Components - CAI App" },
  ],
  component: CatalystTest,
})

function CatalystTest() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState('option1')
  const [switchEnabled, setSwitchEnabled] = useState(true)
  const [selectedListbox, setSelectedListbox] = useState('wade')

  const people = [
    { value: 'wade', label: 'Wade Cooper', email: 'wade@example.com' },
    { value: 'arlene', label: 'Arlene Mccoy', email: 'arlene@example.com' },
    { value: 'devon', label: 'Devon Webb', email: 'devon@example.com' },
    { value: 'tom', label: 'Tom Cook', email: 'tom@example.com' },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div>
        <Catalyst.Heading>Catalyst UI Components Showcase</Catalyst.Heading>
        <Catalyst.Text>
          Comprehensive demonstration of all Catalyst UI components with Tailwind CSS
        </Catalyst.Text>
      </div>

      {/* Typography Section */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Typography</Catalyst.CardTitle>
          <Catalyst.CardDescription>Text components and styles</Catalyst.CardDescription>
        </Catalyst.CardHeader>
        <Catalyst.CardContent className="space-y-4">
          <Catalyst.Heading level={1}>Heading Level 1</Catalyst.Heading>
          <Catalyst.Heading level={2}>Heading Level 2</Catalyst.Heading>
          <Catalyst.Heading level={3}>Heading Level 3</Catalyst.Heading>
          <Catalyst.Subheading>This is a subheading</Catalyst.Subheading>
          <Catalyst.Text>
            This is regular text with <Catalyst.Strong>strong emphasis</Catalyst.Strong> and <Catalyst.Link href="#">a link</Catalyst.Link>.
          </Catalyst.Text>
          <Catalyst.Code>const example = "This is inline code"</Catalyst.Code>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* Buttons Section */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Buttons</Catalyst.CardTitle>
          <Catalyst.CardDescription>Various button styles and states</Catalyst.CardDescription>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <div className="flex flex-wrap gap-3">
            <Catalyst.Button>Primary Button</Catalyst.Button>
            <Catalyst.Button color="zinc">Secondary Button</Catalyst.Button>
            <Catalyst.Button color="white">White Button</Catalyst.Button>
            <Catalyst.Button color="red">Danger Button</Catalyst.Button>
            <Catalyst.Button disabled>Disabled Button</Catalyst.Button>
            <Catalyst.Button>
              <BeakerIcon className="w-4 h-4 mr-2" />
              With Icon
            </Catalyst.Button>
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* Form Controls */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Form Controls</Catalyst.CardTitle>
          <Catalyst.CardDescription>Input fields and form elements</Catalyst.CardDescription>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <Catalyst.Fieldset>
            <Catalyst.Legend>User Information</Catalyst.Legend>
            <Catalyst.FieldGroup>
              <Catalyst.Field>
                <Catalyst.Label>Full Name</Catalyst.Label>
                <Catalyst.Input placeholder="John Doe" />
                <Catalyst.Description>Enter your full name as it appears on your ID</Catalyst.Description>
              </Catalyst.Field>

              <Catalyst.Field>
                <Catalyst.Label>Email Address</Catalyst.Label>
                <Catalyst.Input type="email" placeholder="john@example.com" />
                <Catalyst.ErrorMessage>Please enter a valid email address</Catalyst.ErrorMessage>
              </Catalyst.Field>

              <Catalyst.Field>
                <Catalyst.Label>Bio</Catalyst.Label>
                <Catalyst.Textarea placeholder="Tell us about yourself..." rows={4} />
              </Catalyst.Field>

              <Catalyst.Field>
                <Catalyst.Label>Country</Catalyst.Label>
                <Catalyst.Select>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                  <option>United Kingdom</option>
                </Catalyst.Select>
              </Catalyst.Field>

              <div className="flex items-center gap-8">
                <Catalyst.Field>
                  <Catalyst.Label>Notifications</Catalyst.Label>
                  <Catalyst.Switch checked={switchEnabled} onChange={setSwitchEnabled} />
                </Catalyst.Field>

                <Catalyst.Field>
                  <Catalyst.Checkbox />
                  <Catalyst.Label>I agree to the terms</Catalyst.Label>
                </Catalyst.Field>
              </div>

              <Catalyst.Field>
                <Catalyst.Label>Subscription Plan</Catalyst.Label>
                <Catalyst.RadioGroup value={selectedValue} onChange={setSelectedValue}>
                  <Catalyst.Radio value="option1">
                    <Catalyst.Label>Basic Plan</Catalyst.Label>
                    <Catalyst.Description>$9/month</Catalyst.Description>
                  </Catalyst.Radio>
                  <Catalyst.Radio value="option2">
                    <Catalyst.Label>Pro Plan</Catalyst.Label>
                    <Catalyst.Description>$29/month</Catalyst.Description>
                  </Catalyst.Radio>
                  <Catalyst.Radio value="option3">
                    <Catalyst.Label>Enterprise Plan</Catalyst.Label>
                    <Catalyst.Description>Custom pricing</Catalyst.Description>
                  </Catalyst.Radio>
                </Catalyst.RadioGroup>
              </Catalyst.Field>
            </Catalyst.FieldGroup>
          </Catalyst.Fieldset>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* Badges and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Catalyst.Card>
          <Catalyst.CardHeader>
            <Catalyst.CardTitle>Badges</Catalyst.CardTitle>
          </Catalyst.CardHeader>
          <Catalyst.CardContent>
            <div className="flex flex-wrap gap-2">
              <Catalyst.Badge>Default</Catalyst.Badge>
              <Catalyst.Badge color="blue">Blue</Catalyst.Badge>
              <Catalyst.Badge color="purple">Purple</Catalyst.Badge>
              <Catalyst.Badge color="amber">Amber</Catalyst.Badge>
              <Catalyst.Badge color="green">Green</Catalyst.Badge>
              <Catalyst.Badge color="red">Red</Catalyst.Badge>
              <Catalyst.Badge color="zinc">Zinc</Catalyst.Badge>
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>

        <Catalyst.Card>
          <Catalyst.CardHeader>
            <Catalyst.CardTitle>Alerts</Catalyst.CardTitle>
          </Catalyst.CardHeader>
          <Catalyst.CardContent className="space-y-3">
            <Catalyst.Alert>
              <InformationCircleIcon className="w-5 h-5" />
              <Catalyst.AlertTitle>Information</Catalyst.AlertTitle>
              <Catalyst.AlertDescription>This is an informational message.</Catalyst.AlertDescription>
            </Catalyst.Alert>

            <Catalyst.Alert color="amber">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <Catalyst.AlertTitle>Warning</Catalyst.AlertTitle>
              <Catalyst.AlertDescription>Please review before continuing.</Catalyst.AlertDescription>
            </Catalyst.Alert>

            <Catalyst.Alert color="green">
              <CheckCircleIcon className="w-5 h-5" />
              <Catalyst.AlertTitle>Success</Catalyst.AlertTitle>
              <Catalyst.AlertDescription>Operation completed successfully!</Catalyst.AlertDescription>
            </Catalyst.Alert>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </div>

      {/* Tables */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Table Example</Catalyst.CardTitle>
          <Catalyst.CardDescription>Data display with sorting and actions</Catalyst.CardDescription>
        </Catalyst.CardHeader>
        <Catalyst.CardContent className="p-0">
          <Catalyst.Table>
            <Catalyst.TableHead>
              <Catalyst.TableRow>
                <Catalyst.TableHeader>Name</Catalyst.TableHeader>
                <Catalyst.TableHeader>Email</Catalyst.TableHeader>
                <Catalyst.TableHeader>Role</Catalyst.TableHeader>
                <Catalyst.TableHeader>Status</Catalyst.TableHeader>
                <Catalyst.TableHeader className="text-right">Actions</Catalyst.TableHeader>
              </Catalyst.TableRow>
            </Catalyst.TableHead>
            <Catalyst.TableBody>
              {people.map((person) => (
                <Catalyst.TableRow key={person.value}>
                  <Catalyst.TableCell>
                    <Catalyst.Strong>{person.label}</Catalyst.Strong>
                  </Catalyst.TableCell>
                  <Catalyst.TableCell className="text-zinc-500">
                    {person.email}
                  </Catalyst.TableCell>
                  <Catalyst.TableCell>Administrator</Catalyst.TableCell>
                  <Catalyst.TableCell>
                    <Catalyst.Badge color="green">Active</Catalyst.Badge>
                  </Catalyst.TableCell>
                  <Catalyst.TableCell className="text-right">
                    <Catalyst.Button color="white" className="px-2 py-1 text-sm">
                      Edit
                    </Catalyst.Button>
                  </Catalyst.TableCell>
                </Catalyst.TableRow>
              ))}
            </Catalyst.TableBody>
          </Catalyst.Table>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* Dialog */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Dialogs & Modals</Catalyst.CardTitle>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <Catalyst.Button onClick={() => setDialogOpen(true)}>
            Open Dialog
          </Catalyst.Button>

          <Catalyst.Dialog open={dialogOpen} onClose={setDialogOpen}>
            <Catalyst.DialogTitle>Confirm Action</Catalyst.DialogTitle>
            <Catalyst.DialogDescription>
              Are you sure you want to proceed with this action? This cannot be undone.
            </Catalyst.DialogDescription>
            <Catalyst.DialogActions>
              <Catalyst.Button color="white" onClick={() => setDialogOpen(false)}>
                Cancel
              </Catalyst.Button>
              <Catalyst.Button onClick={() => setDialogOpen(false)}>
                Confirm
              </Catalyst.Button>
            </Catalyst.DialogActions>
          </Catalyst.Dialog>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* Listbox */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Listbox & Dropdown</Catalyst.CardTitle>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <Catalyst.Field>
            <Catalyst.Label>Assign to</Catalyst.Label>
            <Catalyst.Listbox value={selectedListbox} onChange={setSelectedListbox}>
              {people.map((person) => (
                <Catalyst.ListboxOption key={person.value} value={person.value}>
                  <Catalyst.ListboxLabel>{person.label}</Catalyst.ListboxLabel>
                </Catalyst.ListboxOption>
              ))}
            </Catalyst.Listbox>
          </Catalyst.Field>

          <div className="mt-6">
            <Catalyst.Dropdown>
              <Catalyst.DropdownButton>
                <Cog6ToothIcon className="w-4 h-4 mr-2" />
                Options
              </Catalyst.DropdownButton>
              <Catalyst.DropdownMenu>
                <Catalyst.DropdownSection>
                  <Catalyst.DropdownHeading>Account</Catalyst.DropdownHeading>
                  <Catalyst.DropdownItem href="#">
                    <UserCircleIcon className="w-4 h-4" />
                    <Catalyst.DropdownLabel>Profile</Catalyst.DropdownLabel>
                  </Catalyst.DropdownItem>
                  <Catalyst.DropdownItem href="#">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <Catalyst.DropdownLabel>Security</Catalyst.DropdownLabel>
                  </Catalyst.DropdownItem>
                </Catalyst.DropdownSection>
                <Catalyst.DropdownDivider />
                <Catalyst.DropdownItem href="#">
                  <Catalyst.DropdownLabel>Sign out</Catalyst.DropdownLabel>
                </Catalyst.DropdownItem>
              </Catalyst.DropdownMenu>
            </Catalyst.Dropdown>
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* Description List */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Description List</Catalyst.CardTitle>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <Catalyst.DescriptionList>
            <Catalyst.DescriptionTerm>Full Name</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>John Doe</Catalyst.DescriptionDetails>

            <Catalyst.DescriptionTerm>Email Address</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>john.doe@example.com</Catalyst.DescriptionDetails>

            <Catalyst.DescriptionTerm>Account Status</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>
              <Catalyst.Badge color="green">Active</Catalyst.Badge>
            </Catalyst.DescriptionDetails>

            <Catalyst.DescriptionTerm>About</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>
              Passionate developer with expertise in React and TypeScript. 
              Loves building scalable applications and exploring new technologies.
            </Catalyst.DescriptionDetails>
          </Catalyst.DescriptionList>
        </Catalyst.CardContent>
      </Catalyst.Card>
    </div>
  )
}