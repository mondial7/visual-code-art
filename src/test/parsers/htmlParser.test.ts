import * as assert from 'assert';
import { HtmlParser } from '../../services/parsers/htmlParser';
import { createMockDocument, TestCodeSamples } from '../testUtils';

suite('HTML Parser Test Suite', () => {
  let parser: HtmlParser;

  setup(() => {
    parser = new HtmlParser();
  });

  test('should identify HTML files correctly', () => {
    const htmlDoc = createMockDocument('html');
    const tsDoc = createMockDocument('typescript');
    
    assert.strictEqual(parser.canParse(htmlDoc), true);
    assert.strictEqual(parser.canParse(tsDoc), false);
    assert.strictEqual(parser.getSupportedLanguage(), 'HTML');
  });

  test('should extract functions from HTML code', () => {
    const document = createMockDocument('html');
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 4, 'Should find at least 4 functions in HTML sample');
    
    // Verify function names
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes('appendToDisplay'), 'Should find appendToDisplay function');
    assert.ok(functionNames.includes('clearDisplay'), 'Should find clearDisplay function');
    assert.ok(functionNames.includes('calculate'), 'Should find calculate function');
    assert.ok(functionNames.includes('deleteLast'), 'Should find deleteLast function');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('html');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 4, 'Should find multiple functions with metrics');
    
    // Find the calculate function
    const calcFunc = enhancedFunctions.find(f => f.name === 'calculate');
    assert.ok(calcFunc, 'calculate function should be found');
    assert.ok(calcFunc.cyclomaticComplexity >= 2, 'calculate should have try-catch complexity');
    
    // Check that functions have reasonable metrics
    enhancedFunctions.forEach(func => {
      assert.ok(func.cyclomaticComplexity >= 1, `${func.name} should have at least base complexity`);
      assert.ok(func.nestingDepth >= 0, `${func.name} should have non-negative nesting depth`);
    });
  });

  test('should handle Vue.js template syntax', () => {
    const vueCode = `
<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
    <input v-model="message" @input="handleInput" />
    <div v-if="showContent" class="content">
      <p v-show="isVisible">{{ message }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      title: 'Vue App',
      count: 0,
      items: [],
      message: '',
      showContent: true,
      isVisible: false
    }
  },
  methods: {
    increment() {
      this.count++
    },
    handleInput(event) {
      this.message = event.target.value
      this.isVisible = this.message.length > 0
    },
    async fetchItems() {
      try {
        const response = await fetch('/api/items')
        this.items = await response.json()
      } catch (error) {
        console.error('Failed to fetch items:', error)
      }
    }
  },
  mounted() {
    this.fetchItems()
  }
}
</script>

<style scoped>
.content {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}
</style>`;

    const document = createMockDocument('html');
    document.getText = () => vueCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('data'), 'Should detect Vue data function');
    assert.ok(functionNames.includes('increment'), 'Should detect Vue methods');
    assert.ok(functionNames.includes('handleInput'), 'Should detect Vue event handlers');
    assert.ok(functionNames.includes('fetchItems'), 'Should detect async Vue methods');
    assert.ok(functionNames.includes('mounted'), 'Should detect Vue lifecycle hooks');
  });

  test('should handle Angular template syntax', () => {
    const angularCode = `
<div class="user-list">
  <h2>Users</h2>
  <div *ngIf="loading" class="loading">Loading...</div>
  <div *ngFor="let user of users; let i = index" class="user-item">
    <span [class.active]="user.isActive">{{ user.name }}</span>
    <button (click)="editUser(user)" [disabled]="!canEdit">Edit</button>
    <button (click)="deleteUser(user.id)" class="danger">Delete</button>
  </div>
  <form (ngSubmit)="onSubmit()" #userForm="ngForm">
    <input [(ngModel)]="newUser.name" name="name" required>
    <input [(ngModel)]="newUser.email" name="email" type="email" required>
    <button type="submit" [disabled]="!userForm.form.valid">Add User</button>
  </form>
</div>

<script>
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  newUser: User = { name: '', email: '' };
  loading = false;
  canEdit = true;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.userService.getUsers();
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.loading = false;
    }
  }

  editUser(user: User) {
    // Implementation here
  }

  deleteUser(id: number) {
    if (confirm('Are you sure?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== id);
      });
    }
  }

  onSubmit() {
    if (this.newUser.name && this.newUser.email) {
      this.userService.createUser(this.newUser).subscribe(user => {
        this.users.push(user);
        this.newUser = { name: '', email: '' };
      });
    }
  }
}
</script>`;

    const document = createMockDocument('html');
    document.getText = () => angularCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('constructor'), 'Should detect Angular constructor');
    assert.ok(functionNames.includes('ngOnInit'), 'Should detect Angular lifecycle hooks');
    assert.ok(functionNames.includes('loadUsers'), 'Should detect async component methods');
    assert.ok(functionNames.includes('editUser'), 'Should detect event handler methods');
    assert.ok(functionNames.includes('deleteUser'), 'Should detect methods with confirmations');
    assert.ok(functionNames.includes('onSubmit'), 'Should detect form submission handlers');
  });

  test('should provide appropriate confidence scores', () => {
    const htmlDocument = createMockDocument('html');
    htmlDocument.languageId = 'html';
    htmlDocument.fileName = '/test/file.html';
    
    const tsDocument = createMockDocument('typescript');
    
    assert.ok(parser.getConfidence(htmlDocument) >= 0.9, 'Should have high confidence for HTML files');
    assert.ok(parser.getConfidence(tsDocument) < 0.3, 'Should have low confidence for TypeScript files');
  });

  test('should detect interactive elements and complexity', () => {
    const interactiveHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Interactive Form</title>
</head>
<body>
    <form id="registration-form">
        <fieldset>
            <legend>Personal Information</legend>
            <input type="text" name="firstName" required>
            <input type="text" name="lastName" required>
            <input type="email" name="email" required>
            <input type="tel" name="phone">
        </fieldset>
        
        <fieldset>
            <legend>Preferences</legend>
            <select name="country" onchange="updateStates()">
                <option value="">Select Country</option>
                <option value="us">United States</option>
                <option value="ca">Canada</option>
            </select>
            
            <div id="states-container" style="display: none;">
                <select name="state" id="state-select">
                    <option value="">Select State</option>
                </select>
            </div>
            
            <label>
                <input type="checkbox" name="newsletter" checked>
                Subscribe to newsletter
            </label>
        </fieldset>
        
        <button type="submit" onclick="validateForm()">Register</button>
        <button type="reset">Clear Form</button>
    </form>

    <script>
        function updateStates() {
            const country = document.querySelector('[name="country"]').value;
            const statesContainer = document.getElementById('states-container');
            const stateSelect = document.getElementById('state-select');
            
            if (country === 'us') {
                stateSelect.innerHTML = '<option value="ca">California</option><option value="ny">New York</option>';
                statesContainer.style.display = 'block';
            } else if (country === 'ca') {
                stateSelect.innerHTML = '<option value="on">Ontario</option><option value="bc">British Columbia</option>';
                statesContainer.style.display = 'block';
            } else {
                statesContainer.style.display = 'none';
            }
        }
        
        function validateForm() {
            const form = document.getElementById('registration-form');
            const formData = new FormData(form);
            
            if (!formData.get('firstName') || !formData.get('lastName') || !formData.get('email')) {
                alert('Please fill in all required fields');
                return false;
            }
            
            if (!isValidEmail(formData.get('email'))) {
                alert('Please enter a valid email address');
                return false;
            }
            
            return true;
        }
        
        function isValidEmail(email) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return emailRegex.test(email);
        }
    </script>
</body>
</html>`;

    const document = createMockDocument('html');
    document.getText = () => interactiveHtml;
    
    const functions = parser.extractFunctions(document);
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    // Should detect interactive JavaScript functions
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes('updateStates'), 'Should detect state update function');
    assert.ok(functionNames.includes('validateForm'), 'Should detect form validation function');
    assert.ok(functionNames.includes('isValidEmail'), 'Should detect email validation function');
    
    // Enhanced functions should have complexity metrics
    const validateFunc = enhancedFunctions.find(f => f.name === 'validateForm');
    assert.ok(validateFunc, 'validateForm should be found in enhanced functions');
    assert.ok(validateFunc.cyclomaticComplexity >= 3, 'Form validation should have reasonable complexity');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('html');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no JavaScript
    const noJsDoc = createMockDocument('html');
    noJsDoc.getText = () => '<html><body><h1>No JavaScript</h1></body></html>';
    const noJsFunctions = parser.extractFunctions(noJsDoc);
    assert.strictEqual(noJsFunctions.length, 0, 'Should handle HTML without JavaScript');

    // File with broken JavaScript (should not crash)
    const brokenJsDoc = createMockDocument('html');
    brokenJsDoc.getText = () => '<script>function broken( { console.log("broken"); }</script>';
    assert.doesNotThrow(() => {
      parser.extractFunctions(brokenJsDoc);
    }, 'Should handle broken JavaScript gracefully');
  });
});