import * as assert from 'assert';
import { PhpParser } from '../../services/parsers/phpParser';
import { createMockDocument, TestCodeSamples } from '../testUtils';

suite('PHP Parser Test Suite', () => {
  let parser: PhpParser;

  setup(() => {
    parser = new PhpParser();
  });

  test('should identify PHP files correctly', () => {
    const phpDoc = createMockDocument('php');
    const tsDoc = createMockDocument('typescript');
    
    assert.strictEqual(parser.canParse(phpDoc), true);
    assert.strictEqual(parser.canParse(tsDoc), false);
    assert.strictEqual(parser.getSupportedLanguage(), 'PHP');
  });

  test('should extract functions from PHP code', () => {
    const document = createMockDocument('php');
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 5, 'Should find at least 5 functions in PHP sample');
    
    // Verify function names
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes('__construct'), 'Should find constructor');
    assert.ok(functionNames.includes('add'), 'Should find add method');
    assert.ok(functionNames.includes('multiply (static)'), 'Should find static method');
    assert.ok(functionNames.includes('divide'), 'Should find divide method');
    assert.ok(functionNames.includes('processNumbers'), 'Should find method with closures');
    assert.ok(functionNames.includes('isValid (private)'), 'Should find private method');
    assert.ok(functionNames.includes('fibonacci'), 'Should find standalone function');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('php');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 5, 'Should find multiple functions with metrics');
    
    // Find the divide method
    const divideFunc = enhancedFunctions.find(f => f.name === 'divide');
    assert.ok(divideFunc, 'divide method should be found');
    assert.ok(divideFunc.cyclomaticComplexity >= 2, 'divide should have exception handling complexity');
    
    // Find the processNumbers method
    const processFunc = enhancedFunctions.find(f => f.name === 'processNumbers');
    assert.ok(processFunc, 'processNumbers method should be found');
    assert.ok(processFunc.cyclomaticComplexity >= 3, 'method with closures should have reasonable complexity');
    
    // Find the fibonacci function
    const fibFunc = enhancedFunctions.find(f => f.name === 'fibonacci');
    assert.ok(fibFunc, 'fibonacci function should be found');
    assert.ok(fibFunc.cyclomaticComplexity >= 2, 'fibonacci should have conditional complexity');
  });

  test('should handle modern PHP syntax correctly', () => {
    const modernPhpCode = `
<?php

namespace App\\Services;

use Exception;
use Illuminate\\Support\\Collection;

class UserService {
    private array $users = [];
    
    public function __construct(
        private readonly DatabaseService $db,
        private LoggerInterface $logger
    ) {}
    
    public function findUser(int $id): ?User {
        return $this->users[$id] ?? null;
    }
    
    public function getActiveUsers(): Collection {
        return collect($this->users)
            ->filter(fn($user) => $user->isActive())
            ->values();
    }
    
    public function processUsers(callable $callback): array {
        return array_map($callback, $this->users);
    }
    
    public static function createFromConfig(array $config): self {
        $db = new DatabaseService($config['db']);
        $logger = new Logger($config['logger']);
        return new self($db, $logger);
    }
    
    private function validateUser(User $user): bool {
        if (!$user->getEmail()) {
            return false;
        }
        
        return filter_var($user->getEmail(), FILTER_VALIDATE_EMAIL) !== false;
    }
    
    public function __call(string $method, array $args) {
        if (str_starts_with($method, 'findBy')) {
            $field = lcfirst(substr($method, 6));
            return $this->findByField($field, $args[0] ?? null);
        }
        
        throw new BadMethodCallException("Method {$method} not found");
    }
    
    protected function findByField(string $field, $value): ?User {
        foreach ($this->users as $user) {
            if ($user->$field === $value) {
                return $user;
            }
        }
        return null;
    }
}

trait Cacheable {
    private array $cache = [];
    
    protected function getCached(string $key, callable $generator) {
        if (!isset($this->cache[$key])) {
            $this->cache[$key] = $generator();
        }
        return $this->cache[$key];
    }
    
    public function clearCache(): void {
        $this->cache = [];
    }
}

function array_group_by(array $array, callable $keySelector): array {
    $groups = [];
    foreach ($array as $item) {
        $key = $keySelector($item);
        $groups[$key][] = $item;
    }
    return $groups;
}

$closure = function(int $x): int {
    return $x * 2;
};

$arrow = fn($y) => $y + 1;

?>`;

    const document = createMockDocument('php');
    document.getText = () => modernPhpCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('__construct'), 'Should detect constructor with promoted properties');
    assert.ok(functionNames.includes('findUser'), 'Should detect methods with nullable return types');
    assert.ok(functionNames.includes('getActiveUsers'), 'Should detect methods with collection operations');
    assert.ok(functionNames.includes('processUsers'), 'Should detect methods with callable parameters');
    assert.ok(functionNames.includes('createFromConfig (static)'), 'Should detect static factory methods');
    assert.ok(functionNames.includes('validateUser (private)'), 'Should detect private validation methods');
    assert.ok(functionNames.includes('__call'), 'Should detect magic methods');
    assert.ok(functionNames.includes('findByField (protected)'), 'Should detect protected methods');
    assert.ok(functionNames.includes('getCached (protected)'), 'Should detect trait methods');
    assert.ok(functionNames.includes('clearCache'), 'Should detect trait methods');
    assert.ok(functionNames.includes('array_group_by'), 'Should detect standalone functions');
  });

  test('should provide appropriate confidence scores', () => {
    const phpDocument = createMockDocument('php');
    phpDocument.languageId = 'php';
    phpDocument.fileName = '/test/file.php';
    
    const tsDocument = createMockDocument('typescript');
    
    assert.ok(parser.getConfidence(phpDocument) >= 0.9, 'Should have high confidence for PHP files');
    assert.ok(parser.getConfidence(tsDocument) < 0.3, 'Should have low confidence for TypeScript files');
  });

  test('should handle Laravel framework patterns', () => {
    const laravelCode = `
<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;
use App\\Models\\User;

class UserController extends Controller {
    public function index(Request $request): JsonResponse {
        $users = User::query()
            ->when($request->has('search'), function ($query) use ($request) {
                return $query->where('name', 'like', '%' . $request->search . '%');
            })
            ->paginate(15);
        
        return response()->json($users);
    }
    
    public function store(UserRequest $request): JsonResponse {
        $user = User::create($request->validated());
        
        if ($request->hasFile('avatar')) {
            $this->handleAvatarUpload($user, $request->file('avatar'));
        }
        
        return response()->json($user, 201);
    }
    
    protected function handleAvatarUpload(User $user, $file): void {
        $path = $file->store('avatars', 'public');
        $user->update(['avatar_path' => $path]);
    }
}

class User extends Model {
    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['email_verified_at' => 'datetime'];
    
    public function posts() {
        return $this->hasMany(Post::class);
    }
    
    public function getFullNameAttribute(): string {
        return $this->first_name . ' ' . $this->last_name;
    }
    
    public function setPasswordAttribute(string $value): void {
        $this->attributes['password'] = bcrypt($value);
    }
    
    public function scopeActive($query) {
        return $query->where('active', true);
    }
    
    public function scopeVerified($query) {
        return $query->whereNotNull('email_verified_at');
    }
}

class UserRequest extends FormRequest {
    public function authorize(): bool {
        return auth()->check();
    }
    
    public function rules(): array {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ];
    }
    
    public function messages(): array {
        return [
            'email.unique' => 'This email is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}

?>`;

    const document = createMockDocument('php');
    document.getText = () => laravelCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('index'), 'Should detect controller actions');
    assert.ok(functionNames.includes('store'), 'Should detect controller actions');
    assert.ok(functionNames.includes('handleAvatarUpload (protected)'), 'Should detect protected helper methods');
    assert.ok(functionNames.includes('posts'), 'Should detect Eloquent relationships');
    assert.ok(functionNames.includes('getFullNameAttribute'), 'Should detect Eloquent accessors');
    assert.ok(functionNames.includes('setPasswordAttribute'), 'Should detect Eloquent mutators');
    assert.ok(functionNames.includes('scopeActive'), 'Should detect Eloquent scopes');
    assert.ok(functionNames.includes('authorize'), 'Should detect FormRequest methods');
    assert.ok(functionNames.includes('rules'), 'Should detect validation rules');
    assert.ok(functionNames.includes('messages'), 'Should detect validation messages');
  });

  test('should handle WordPress patterns', () => {
    const wpCode = `
<?php

function my_theme_setup() {
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    register_nav_menus(array(
        'primary' => 'Primary Menu',
        'footer' => 'Footer Menu'
    ));
}
add_action('after_setup_theme', 'my_theme_setup');

function my_theme_enqueue_scripts() {
    wp_enqueue_style('theme-style', get_stylesheet_uri());
    wp_enqueue_script('theme-script', get_template_directory_uri() . '/js/script.js', array('jquery'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'my_theme_enqueue_scripts');

class CustomPostTypes {
    public function __construct() {
        add_action('init', array($this, 'register_post_types'));
    }
    
    public function register_post_types() {
        register_post_type('portfolio', array(
            'public' => true,
            'label' => 'Portfolio Items',
            'supports' => array('title', 'editor', 'thumbnail')
        ));
    }
}

function custom_login_redirect($redirect_to, $request, $user) {
    if (isset($user->roles) && is_array($user->roles)) {
        if (in_array('administrator', $user->roles)) {
            return admin_url();
        } else {
            return home_url('/dashboard');
        }
    }
    return $redirect_to;
}
add_filter('login_redirect', 'custom_login_redirect', 10, 3);

?>`;

    const document = createMockDocument('php');
    document.getText = () => wpCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('my_theme_setup'), 'Should detect WordPress setup functions');
    assert.ok(functionNames.includes('my_theme_enqueue_scripts'), 'Should detect WordPress enqueue functions');
    assert.ok(functionNames.includes('__construct'), 'Should detect class constructors');
    assert.ok(functionNames.includes('register_post_types'), 'Should detect WordPress registration methods');
    assert.ok(functionNames.includes('custom_login_redirect'), 'Should detect WordPress filter functions');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('php');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no functions
    const noFuncDoc = createMockDocument('php');
    noFuncDoc.getText = () => '<?php $x = 1; $y = 2; echo $x + $y; ?>';
    const noFunctions = parser.extractFunctions(noFuncDoc);
    assert.strictEqual(noFunctions.length, 0, 'Should handle files with no functions');

    // File with incomplete function (should not crash)
    const incompleteDoc = createMockDocument('php');
    incompleteDoc.getText = () => '<?php function incomplete( { echo "broken"; ?>';
    assert.doesNotThrow(() => {
      parser.extractFunctions(incompleteDoc);
    }, 'Should handle incomplete syntax gracefully');
  });
});